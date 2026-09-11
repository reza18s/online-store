import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { ApiEnvelope, CartView } from '@nova/api-client';
import { environment } from '@nova/config';

import { appendSetCookie, type ResponseWithHeaders } from '../../common/http/request-id.middleware';
import {
  CustomerAuthGuard,
  requestCookie,
  type CustomerRequest,
} from '../auth/customer-auth.guard';
import { CUSTOMER_SESSION_COOKIE_NAME, SessionService } from '../auth/session.service';
import { CartService, CART_COOKIE_NAME, CART_MAX_AGE_SECONDS } from './cart.service';
import { CartItemMutationDto, CartItemQuantityDto } from './dto/cart-item.mutation';
import { CartMergeDto } from './dto/cart-merge.mutation';

type CartRequest = CustomerRequest;

function getCartToken(request: CartRequest): string | undefined {
  return requestCookie(request, CART_COOKIE_NAME);
}

function setCartCookie(response: ResponseWithHeaders, token: string): void {
  const secure = environment.WEB_ORIGIN.startsWith('https://') ? '; Secure' : '';
  appendSetCookie(
    response,
    `${CART_COOKIE_NAME}=${token}; Max-Age=${CART_MAX_AGE_SECONDS}; Path=/; HttpOnly; SameSite=Lax${secure}`,
  );
}

function clearCartCookie(response: ResponseWithHeaders): void {
  const secure = environment.WEB_ORIGIN.startsWith('https://') ? '; Secure' : '';
  appendSetCookie(
    response,
    `${CART_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure}`,
  );
}

@Controller('cart')
export class CartController {
  public constructor(
    private readonly cart: CartService,
    private readonly sessions: SessionService,
  ) {}

  @Get()
  public async current(@Req() request: CartRequest): Promise<ApiEnvelope<CartView>> {
    return this.envelope(
      request,
      await this.cart.getCart(getCartToken(request), await this.customerId(request)),
    );
  }

  @Post('items')
  public async addItem(
    @Req() request: CartRequest,
    @Res({ passthrough: true }) response: ResponseWithHeaders,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() body: CartItemMutationDto,
  ): Promise<ApiEnvelope<CartView>> {
    const result = await this.cart.addItem(
      getCartToken(request),
      body,
      idempotencyKey,
      await this.customerId(request),
    );
    if (result.token) setCartCookie(response, result.token);
    return this.envelope(request, result.cart);
  }

  @Post('merge')
  @UseGuards(CustomerAuthGuard)
  public async merge(
    @Req() request: CartRequest,
    @Res({ passthrough: true }) response: ResponseWithHeaders,
    @Body() body?: CartMergeDto,
  ): Promise<ApiEnvelope<CartView>> {
    if (!request.customer) throw new UnauthorizedException('برای ادامه وارد حساب شوید.');
    const cart = await this.cart.mergeGuestIntoCustomer(
      getCartToken(request),
      request.customer.id,
      body?.resolutions ?? [],
    );
    clearCartCookie(response);
    return this.envelope(request, cart);
  }

  @Patch('items/:variantId')
  public async updateItem(
    @Param('variantId') variantId: string,
    @Req() request: CartRequest,
    @Body() body: CartItemQuantityDto,
  ): Promise<ApiEnvelope<CartView>> {
    return this.envelope(
      request,
      await this.cart.updateItem(
        getCartToken(request),
        variantId,
        body.quantity,
        await this.customerId(request),
      ),
    );
  }

  @Delete('items/:variantId')
  public async removeItem(
    @Param('variantId') variantId: string,
    @Req() request: CartRequest,
  ): Promise<ApiEnvelope<CartView>> {
    return this.envelope(
      request,
      await this.cart.removeItem(getCartToken(request), variantId, await this.customerId(request)),
    );
  }

  private async customerId(request: CartRequest): Promise<string | undefined> {
    const token = requestCookie(request, CUSTOMER_SESSION_COOKIE_NAME);
    if (!token) return undefined;
    return (await this.sessions.resolveCustomerSession(token))?.user.id;
  }

  private envelope<T>(request: CartRequest, data: T): ApiEnvelope<T> {
    return {
      data,
      meta: {
        requestId: request.requestId ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
