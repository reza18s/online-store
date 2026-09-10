import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { ApiEnvelope, CustomerAddress as CustomerAddressResponse } from '@nova/api-client';

import type { RequestWithId } from '../../common/http/request-id.middleware';
import { CustomerAuthGuard, type CustomerRequest } from '../auth/customer-auth.guard';
import {
  AddressService,
  type AddressCreateInput,
  type AddressUpdateInput,
  type CustomerAddress as CustomerAddressRecord,
} from './address.service';
import { AddressCreateDto, AddressUpdateDto } from './dto/address.dto';

@Controller('account/addresses')
@UseGuards(CustomerAuthGuard)
export class AddressController {
  public constructor(private readonly addresses: AddressService) {}

  @Get()
  public async list(
    @Req() request: CustomerRequest,
  ): Promise<ApiEnvelope<CustomerAddressResponse[]>> {
    const addresses = await this.addresses.list(this.userId(request));
    return this.envelope(request, addresses.map(toCustomerAddressResponse));
  }

  @Post()
  public async create(
    @Req() request: CustomerRequest,
    @Body() body: AddressCreateDto,
  ): Promise<ApiEnvelope<CustomerAddressResponse>> {
    return this.envelope(
      request,
      toCustomerAddressResponse(
        await this.addresses.create(this.userId(request), body as AddressCreateInput),
      ),
    );
  }

  @Patch(':addressId')
  public async update(
    @Req() request: CustomerRequest,
    @Param('addressId') addressId: string,
    @Body() body: AddressUpdateDto,
  ): Promise<ApiEnvelope<CustomerAddressResponse>> {
    return this.envelope(
      request,
      toCustomerAddressResponse(
        await this.addresses.update(this.userId(request), addressId, body as AddressUpdateInput),
      ),
    );
  }

  @Post(':addressId/default')
  public async setDefault(
    @Req() request: CustomerRequest,
    @Param('addressId') addressId: string,
  ): Promise<ApiEnvelope<CustomerAddressResponse>> {
    return this.envelope(
      request,
      toCustomerAddressResponse(await this.addresses.setDefault(this.userId(request), addressId)),
    );
  }

  @Delete(':addressId')
  public async remove(
    @Req() request: CustomerRequest,
    @Param('addressId') addressId: string,
  ): Promise<ApiEnvelope<CustomerAddressResponse[]>> {
    const addresses = await this.addresses.remove(this.userId(request), addressId);
    return this.envelope(request, addresses.map(toCustomerAddressResponse));
  }

  private userId(request: CustomerRequest): string {
    if (!request.customer) throw new Error('CustomerAuthGuard did not attach a customer.');
    return request.customer.id;
  }

  private envelope<T>(request: RequestWithId, data: T): ApiEnvelope<T> {
    return {
      data,
      meta: {
        requestId: request.requestId ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

function toCustomerAddressResponse(source: CustomerAddressRecord): CustomerAddressResponse {
  return {
    id: source.id,
    label: source.label,
    recipientName: source.recipientName,
    phone: source.phone,
    province: source.province,
    city: source.city,
    addressLine: source.addressLine,
    postalCode: source.postalCode,
    isDefault: source.isDefault,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}
