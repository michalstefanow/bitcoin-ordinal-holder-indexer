export interface ICollection {
  name: string;
  slug: string;
  inscription_icon_id: string;
  icon_url: string;
  icon_render_url: string | null;
  bis_url: string;
  supply: string;
  min_number: number;
  median_number: number;
  max_number: number;
  listed_count: number;
  floor_price: number | null;
  floor_price_ordswap: number | null;
  floor_price_magiceden: number | null;
  floor_price_ordinalswallet: number | null;
  floor_price_gammaio: number | null;
  floor_price_ordynals: number | null;
  floor_price_unisat: number | null;
  floor_price_ordinalsmarket: number | null;
  floor_price_okx: number | null;
  vol_3h_in_btc: number;
  vol_24h_in_btc: number;
  vol_7d_in_btc: number;
  vol_30d_in_btc: number;
  sale_cnt_7d: number;
  vol_total_in_btc: number;
  sale_cnt_total: number;
  marketcap: number;
}

export interface IHolder {
  wallet: string;
  inscription_ids: string[];
}