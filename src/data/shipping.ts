export type Country = {code: string; name: string; en: string};
export type FreightZone = {id: string; name: string; fee: number; freeOver: number | null; countries: readonly string[]};
export type FreightQuote = {zoneId: string; zoneName: string; fee: number; freeOver: number | null; isFree: boolean; remaining: number};

export const FREIGHT_ZONES: readonly FreightZone[] = [
  {id: 'cn', name: '中国大陆', fee: 39, freeOver: 999, countries: ['CN']},
  {id: 'hmt', name: '港澳台', fee: 99, freeOver: 1499, countries: ['HK', 'MO', 'TW']},
  {id: 'jk', name: '日韩', fee: 129, freeOver: 1599, countries: ['JP', 'KR']},
  {id: 'sea', name: '东南亚', fee: 139, freeOver: 1699, countries: ['SG', 'MY', 'TH', 'VN', 'ID', 'PH']},
  {id: 'na', name: '北美', fee: 199, freeOver: 1999, countries: ['US', 'CA']},
  {id: 'eu', name: '欧洲', fee: 219, freeOver: 1999, countries: ['GB', 'FR', 'DE', 'IT', 'ES', 'NL']},
  {id: 'oc', name: '澳新', fee: 189, freeOver: 1899, countries: ['AU', 'NZ']},
  {id: 'other', name: '其他地区', fee: 299, freeOver: null, countries: []},
];

export const COUNTRIES: readonly Country[] = [
  {code: 'CN', name: '中国大陆', en: 'China Mainland'},
  {code: 'HK', name: '中国香港', en: 'Hong Kong SAR'},
  {code: 'MO', name: '中国澳门', en: 'Macao SAR'},
  {code: 'TW', name: '中国台湾', en: 'Taiwan'},
  {code: 'JP', name: '日本', en: 'Japan'},
  {code: 'KR', name: '韩国', en: 'South Korea'},
  {code: 'SG', name: '新加坡', en: 'Singapore'},
  {code: 'MY', name: '马来西亚', en: 'Malaysia'},
  {code: 'TH', name: '泰国', en: 'Thailand'},
  {code: 'VN', name: '越南', en: 'Vietnam'},
  {code: 'ID', name: '印度尼西亚', en: 'Indonesia'},
  {code: 'PH', name: '菲律宾', en: 'Philippines'},
  {code: 'US', name: '美国', en: 'United States'},
  {code: 'CA', name: '加拿大', en: 'Canada'},
  {code: 'GB', name: '英国', en: 'United Kingdom'},
  {code: 'FR', name: '法国', en: 'France'},
  {code: 'DE', name: '德国', en: 'Germany'},
  {code: 'IT', name: '意大利', en: 'Italy'},
  {code: 'ES', name: '西班牙', en: 'Spain'},
  {code: 'NL', name: '荷兰', en: 'Netherlands'},
  {code: 'AU', name: '澳大利亚', en: 'Australia'},
  {code: 'NZ', name: '新西兰', en: 'New Zealand'},
  {code: 'OTHER', name: '其他国家/地区', en: 'Other'},
];

export const getCountryName = (code: string): string => COUNTRIES.find((c) => c.code === code)?.name ?? code;

export const findZone = (countryCode: string): FreightZone => (
  FREIGHT_ZONES.find((zone) => (zone.countries as readonly string[]).includes(countryCode))
  ?? FREIGHT_ZONES[FREIGHT_ZONES.length - 1]
);

export const resolveFreight = (countryCode: string, subtotal: number): FreightQuote => {
  const zone = findZone(countryCode);
  const isFree = zone.freeOver !== null && subtotal >= zone.freeOver;
  return {
    zoneId: zone.id,
    zoneName: zone.name,
    fee: isFree ? 0 : zone.fee,
    freeOver: zone.freeOver,
    isFree,
    remaining: isFree || zone.freeOver === null ? 0 : Math.max(0, zone.freeOver - subtotal),
  };
};
