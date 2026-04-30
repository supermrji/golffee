export const ALL_REGION = '全部'
export const DEFAULT_PAGE_TITLE = '全台高爾夫球場收費查詢'
export const SITE_URL = 'https://golffee.vercel.app'

export const REGION_SLUGS = {
  taipei:   '台北市、新北市',
  taoyuan:  '桃園地區',
  hsinchu:  '新竹、苗栗',
  taichung: '台中、彰化、南投',
  tainan:   '嘉義、台南、高雄、屏東',
  hualien:  '花東地區',
}

export const REGION_TO_SLUG = Object.fromEntries(
  Object.entries(REGION_SLUGS).map(([k, v]) => [v, k])
)

export const REGION_PAGE_TITLES = {
  '台北市、新北市':         '台北、新北高爾夫球場收費查詢',
  '桃園地區':               '桃園高爾夫球場收費查詢',
  '新竹、苗栗':             '新竹、苗栗高爾夫球場收費查詢',
  '台中、彰化、南投':       '台中、彰化、南投高爾夫球場收費查詢',
  '嘉義、台南、高雄、屏東': '南台灣高爾夫球場收費查詢',
  '花東地區':               '花東高爾夫球場收費查詢',
}

export const REGION_NAV_LABELS = {
  taipei:   '台北、新北',
  taoyuan:  '桃園',
  hsinchu:  '新竹、苗栗',
  taichung: '台中、彰化、南投',
  tainan:   '南台灣',
  hualien:  '花東',
}
