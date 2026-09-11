import { DatabaseClient } from '../../packages/db/src/client';
import type { InventoryReservationBatch } from '../../apps/api/src/modules/inventory/inventory.service';
import { InventoryService } from '../../apps/api/src/modules/inventory/inventory.service';

interface TargetInventory {
  id: string;
  variantId: string;
  onHand: number;
  reserved: number;
}

interface CleanupEvidence {
  deletedMovements: number;
  deletedReservations: number;
  remainingMovements: number;
  remainingReservations: number;
  restoredInventory: boolean;
}

interface ConcurrencyEvidence {
  after: {
    onHand: number;
    reserved: number;
  };
  fulfilled: number;
  rejected: number;
  rejectionMessages: string[];
  reservationIds: string[];
  stockMovementIds: string[];
  targetInventoryId: string;
  targetVariantId: string;
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  return String(error);
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  assertCondition(
    databaseUrl,
    'DATABASE_URL is required. This harness never falls back to the local database default.',
  );

  const control = new DatabaseClient({ connectionString: databaseUrl });
  const first = new DatabaseClient({ connectionString: databaseUrl });
  const second = new DatabaseClient({ connectionString: databaseUrl });
  const clients = [control, first, second];

  let target: TargetInventory | null = null;
  let baseline: { onHand: number; reserved: number } | null = null;
  const createdReservationIds = new Set<string>();
  let evidence: ConcurrencyEvidence | null = null;
  let primaryFailure: unknown = null;
  let cleanupFailure: unknown = null;
  const disconnectFailures: string[] = [];
  let cleanup: CleanupEvidence | null = null;

  try {
    await Promise.all(clients.map((client) => client.$connect()));

    target = await control.inventoryItem.findFirst({
      where: {
        onHand: { gt: 0 },
        reserved: 0,
        variant: {
          isActive: true,
          product: { status: 'PUBLISHED', archivedAt: null },
        },
      },
      select: {
        id: true,
        variantId: true,
        onHand: true,
        reserved: true,
      },
    });
    assertCondition(
      target,
      'No published active product variant with available inventory was found in the database.',
    );

    baseline = { onHand: target.onHand, reserved: target.reserved };
    const prepared = await control.inventoryItem.updateMany({
      where: {
        id: target.id,
        onHand: target.onHand,
        reserved: target.reserved,
      },
      data: { onHand: 1, reserved: 0 },
    });
    assertCondition(
      prepared.count === 1,
      'The selected inventory row changed before the harness started.',
    );

    const firstService = new InventoryService({ prisma: first } as never);
    const secondService = new InventoryService({ prisma: second } as never);
    const results = await Promise.allSettled([
      firstService.reserve({ lines: [{ variantId: target.variantId, quantity: 1 }] }),
      secondService.reserve({ lines: [{ variantId: target.variantId, quantity: 1 }] }),
    ]);

    const fulfilled = results.filter(
      (result): result is PromiseFulfilledResult<InventoryReservationBatch> =>
        result.status === 'fulfilled',
    );
    const rejected = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    const reservationIds = fulfilled.flatMap((result) =>
      result.value.reservations.map((reservation) => reservation.id),
    );
    reservationIds.forEach((id) => createdReservationIds.add(id));
    const rejectionMessages = rejected.map((result) => errorMessage(result.reason));

    assertCondition(
      fulfilled.length === 1 && rejected.length === 1,
      `Expected exactly one successful reservation and one rejection; got fulfilled=${fulfilled.length}, rejected=${rejected.length}.`,
    );
    assertCondition(
      reservationIds.length === 1,
      `Expected exactly one created reservation; got ${reservationIds.length}.`,
    );
    assertCondition(
      rejectionMessages.some((message) => message.includes('کافی نیست')),
      `The rejected reservation did not fail with insufficient-stock conflict: ${rejectionMessages.join(' | ')}`,
    );

    const movementReferences = reservationIds.map((id) => `reservation:${id}`);
    const [after, reservations, stockMovements] = await Promise.all([
      control.inventoryItem.findUnique({
        where: { id: target.id },
        select: { onHand: true, reserved: true },
      }),
      control.inventoryReservation.findMany({
        where: { id: { in: reservationIds }, inventoryItemId: target.id },
        select: { id: true, quantity: true, status: true },
      }),
      control.stockMovement.findMany({
        where: {
          inventoryItemId: target.id,
          reference: { in: movementReferences },
        },
        select: { id: true, reference: true, quantity: true, type: true },
      }),
    ]);

    const reservationId = reservationIds.at(0);
    const persistedReservation = reservations.at(0);
    const persistedStockMovement = stockMovements.at(0);
    assertCondition(after, 'The post-race inventory row was not found.');
    assertCondition(
      after.onHand === 1 && after.reserved === 1,
      'The post-race inventory state was not onHand=1/reserved=1.',
    );
    assertCondition(reservationId, 'The successful reservation id was not returned.');
    assertCondition(
      reservations.length === 1 &&
        persistedReservation?.id === reservationId &&
        persistedReservation.quantity === 1 &&
        persistedReservation.status === 'ACTIVE',
      'The successful reservation row was not persisted as one ACTIVE quantity-1 reservation.',
    );
    assertCondition(persistedStockMovement, 'The successful stock movement row was not returned.');
    assertCondition(
      stockMovements.length === 1 &&
        persistedStockMovement.reference === movementReferences[0] &&
        persistedStockMovement.quantity === 1 &&
        persistedStockMovement.type === 'RESERVATION',
      'The successful reservation did not produce exactly one matching RESERVATION stock movement.',
    );

    evidence = {
      after,
      fulfilled: fulfilled.length,
      rejected: rejected.length,
      rejectionMessages,
      reservationIds,
      stockMovementIds: stockMovements.map((movement) => movement.id),
      targetInventoryId: target.id,
      targetVariantId: target.variantId,
    };
  } catch (error) {
    primaryFailure = error;
  }

  try {
    if (target && baseline) {
      const reservationIds = [...createdReservationIds];
      const movementReferences = reservationIds.map((id) => `reservation:${id}`);
      const deletedMovements = movementReferences.length
        ? await control.stockMovement.deleteMany({
            where: {
              inventoryItemId: target.id,
              reference: { in: movementReferences },
            },
          })
        : { count: 0 };
      const deletedReservations = reservationIds.length
        ? await control.inventoryReservation.deleteMany({
            where: { id: { in: reservationIds }, inventoryItemId: target.id },
          })
        : { count: 0 };
      const restored = await control.inventoryItem.updateMany({
        where: { id: target.id },
        data: { onHand: baseline.onHand, reserved: baseline.reserved },
      });
      const [remainingMovements, remainingReservations, restoredInventory] = await Promise.all([
        movementReferences.length
          ? control.stockMovement.count({
              where: {
                inventoryItemId: target.id,
                reference: { in: movementReferences },
              },
            })
          : Promise.resolve(0),
        reservationIds.length
          ? control.inventoryReservation.count({
              where: { id: { in: reservationIds }, inventoryItemId: target.id },
            })
          : Promise.resolve(0),
        control.inventoryItem.findUnique({
          where: { id: target.id },
          select: { onHand: true, reserved: true },
        }),
      ]);
      assertCondition(restored.count === 1, 'The selected inventory row could not be restored.');
      assertCondition(
        remainingMovements === 0,
        'Synthetic stock movements remained after cleanup.',
      );
      assertCondition(
        remainingReservations === 0,
        'Synthetic reservations remained after cleanup.',
      );
      assertCondition(
        restoredInventory?.onHand === baseline.onHand &&
          restoredInventory.reserved === baseline.reserved,
        'The selected inventory row did not return to its exact baseline state.',
      );
      cleanup = {
        deletedMovements: deletedMovements.count,
        deletedReservations: deletedReservations.count,
        remainingMovements,
        remainingReservations,
        restoredInventory: true,
      };
    }
  } catch (error) {
    cleanupFailure = error;
  }

  await Promise.all(
    clients.map(async (client) => {
      try {
        await client.$disconnect();
      } catch (error) {
        disconnectFailures.push(errorMessage(error));
      }
    }),
  );

  if (primaryFailure || cleanupFailure || disconnectFailures.length || !evidence || !cleanup) {
    const details = [
      primaryFailure ? `primary=${errorMessage(primaryFailure)}` : null,
      cleanupFailure ? `cleanup=${errorMessage(cleanupFailure)}` : null,
      disconnectFailures.length ? `disconnect=${disconnectFailures.join(' | ')}` : null,
      !evidence ? 'evidence=missing' : null,
      !cleanup ? 'cleanup=missing' : null,
    ].filter(Boolean);
    throw new Error(details.join('; '));
  }

  console.log(
    JSON.stringify({
      event: 'live_inventory_concurrency',
      database: 'explicit DATABASE_URL',
      execution: 'two independent DatabaseClient instances via Promise.allSettled',
      ...evidence,
      cleanup,
    }),
  );
}

await main().catch((error: unknown) => {
  console.error(`[FAIL] live inventory concurrency: ${errorMessage(error)}`);
  process.exitCode = 1;
});
