import { FetchConfig } from '@/utils/service/httpRequest'
import axios from '@/utils/service/axios'

export const musicList = (query: any, config?: FetchConfig) =>
  axios.get('/login', query, config)
