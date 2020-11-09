import { FetchConfig } from '@/utils/service/httpRequest'
import axios from '@/utils/service/axios'

export const homepage = (query?: any, config?: FetchConfig) =>
  axios.get('/homepage/block/page', query, config)
