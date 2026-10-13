import {COUNTRIES} from '../data/shipping';
import type {AddressFormValues} from '../data/address';
import {Select} from './ui';

type AddressFormProps = {
  values: AddressFormValues;
  onChange: (field: keyof AddressFormValues, value: string) => void;
  idPrefix: string;
  invalid?: Partial<Record<keyof AddressFormValues, boolean>>;
};

export function AddressForm({values, onChange, idPrefix, invalid = {}}: AddressFormProps) {
  const field = (name: keyof AddressFormValues) => ({
    id: `${idPrefix}-${name}`,
    value: values[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(name, event.target.value),
    'aria-invalid': Boolean(invalid[name]) || undefined,
  });
  return (
    <div className="addressForm">
      <div className="addressFormRow">
        <label htmlFor={`${idPrefix}-name`}>收货人
          <input {...field('name')} autoComplete="name" />
        </label>
        <label htmlFor={`${idPrefix}-phone`}>联系电话
          <input {...field('phone')} inputMode="tel" autoComplete="tel" placeholder="+86 138 0000 0000" />
        </label>
      </div>
      <label className="addressFormFull" htmlFor={`${idPrefix}-country`}>国家 / 地区
        <Select
          id={`${idPrefix}-country`}
          aria-label="国家或地区"
          options={COUNTRIES.map((c) => ({value: c.code, label: `${c.name} ${c.en}`}))}
          value={values.country}
          onChange={(code) => onChange('country', code)}
        />
      </label>
      <div className="addressFormRow">
        <label htmlFor={`${idPrefix}-province`}>省 / 州
          <input {...field('province')} autoComplete="address-level1" />
        </label>
        <label htmlFor={`${idPrefix}-city`}>城市
          <input {...field('city')} autoComplete="address-level2" />
        </label>
      </div>
      <label className="addressFormFull" htmlFor={`${idPrefix}-detail`}>详细地址
        <textarea {...field('detail')} autoComplete="street-address" placeholder="街道、门牌号、楼层等" />
      </label>
      <label className="addressFormPostcode" htmlFor={`${idPrefix}-postcode`}>邮政编码
        <input {...field('postcode')} autoComplete="postal-code" />
      </label>
    </div>
  );
}

export default AddressForm;
