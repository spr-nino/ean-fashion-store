import type {Address} from '../context/store';

export type AddressFormValues = {
  name: string; phone: string; country: string;
  province: string; city: string; postcode: string; detail: string;
};

export const emptyAddressValues = (): AddressFormValues => ({
  name: '', phone: '', country: 'CN', province: '', city: '', postcode: '', detail: '',
});

export const valuesFromAddress = (address: Address): AddressFormValues => ({
  name: address.name, phone: address.phone, country: address.country,
  province: address.province, city: address.city, postcode: address.postcode, detail: address.detail,
});

export function validateAddress(values: AddressFormValues): string | null {
  if (!values.name.trim()) return '请填写收货人姓名';
  if (!/^[+\d][\d\s-]{5,19}$/.test(values.phone.trim())) return '请填写正确的联系电话';
  if (!values.country) return '请选择国家或地区';
  if (!values.province.trim()) return '请填写省 / 州';
  if (!values.city.trim()) return '请填写城市';
  if (!values.detail.trim()) return '请填写详细地址';
  if (!/^[A-Za-z0-9][A-Za-z0-9\s-]{2,9}$/.test(values.postcode.trim())) return '请填写正确的邮政编码';
  return null;
}
