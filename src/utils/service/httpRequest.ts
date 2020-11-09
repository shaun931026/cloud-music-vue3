import axios, { AxiosInstance, AxiosRequestConfig, AxiosPromise, Canceler } from 'axios'
import errorHandle from './errorHandle'
import qs from 'qs'

interface Pending {
  [prop: string]: Canceler
}

export interface FetchConfig extends AxiosRequestConfig {
  /**
   * 标识是请求取消还是拦截请求
   * @default false 请求取消
   */
  isIntercept?: boolean
}

interface Expose {
  key: string
  setKey: (config: FetchConfig, isIntercept?: boolean) => void
  getKey: () => string
}

interface ClassHttpRequest {
  baseURL: string
  pending: Pending
  getDefaultConfig: () => FetchConfig
  createAxiosInstance: (options: FetchConfig) => AxiosPromise
  cancelKeyManager(): Expose
  interceptors: (instance: AxiosInstance) => void
  handleRequestCancel: (config: FetchConfig) => FetchConfig
  removeRequest: (key: string, isRequest: boolean, c?: Canceler) => void
  get: (url: string, query: any, config: FetchConfig) => AxiosPromise
  post: (url: string, data: any, config: FetchConfig) => AxiosPromise
}

/**
 * 请求类  
 * 小改自掘金的文章 
 * @see https://juejin.im/post/6890147963037974542#heading-3
 */
class HttpRequest implements ClassHttpRequest {
  public baseURL: string
  public pending: Pending

  constructor(baseUrl = '') {
    this.baseURL = baseUrl
    this.pending = {}
  }

  /**
   * axios默认配置
   * @return {Object} axios默认配置
   * @memberof HttpRequest
   */
  getDefaultConfig(): FetchConfig {
    return {
      baseURL: this.baseURL,
      headers: {
        post: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      },
      withCredentials: true,
      timeout: 10 * 1000
    }
  }

  /**
   * 创建axios实例
   * @param {Object} options 用户传进来的配置
   * @return {Axios} 返回axios实例
   * @memberof HttpRequest
   */
  createAxiosInstance(options: FetchConfig): AxiosPromise {
    const axiosInstance = axios.create()
    // 将默认配置和用户设置的配置进行合并
    const newOptions: FetchConfig = { ...this.getDefaultConfig(), ...options }
    // 调用拦截器
    this.interceptors(axiosInstance)
    // 返回实例
    return axiosInstance(newOptions)
  }

  /**
   * cancelKey管理器
   * @return {Object} 返回一个对象，对象暴露两个方法，一个可以获取本次请求的key，一个是设置本次请求的key
   * @memberof HttpRequest
   */
  cancelKeyManager(): Expose {
    const expose: Expose = {
      key: '',
      setKey: (config, isIntercept = false) => {
        const { method, url, params, data } = config
        expose.key = `${method}&${url}`

        // 主要针对用户频繁切换分类、请求下一页的情况，拦截已经发出去的请求
        // isIntercept true: 请求拦截 false: 请求取消
        if (!isIntercept) {
          return
        }

        // 主要针对同一个请求，比如请求验证码、提交表单，主要用来取消当前请求
        expose.key = method === 'get'
          ? `${expose.key}&${qs.stringify(params)}`
          : `${expose.key}&${qs.stringify(data)}`
      },
      getKey: () => expose.key
    }

    return expose
  }

  /**
   * 拦截器
   * @param {Axios} instance
   * @memberof HttpRequest
   */
  interceptors(instance: AxiosInstance): void {
    // 添加请求拦截器
    instance.interceptors.request.use((config) => {
      // 对请求进行拦截
      // 如果post请求格式是application/x-www-form-urlencoded，则序列化数据
      if (
        config.headers.post['Content-Type'].startsWith('application/x-www-form-urlencoded') &&
        config.method === 'post'
      ) {
        config.data = qs.stringify(config.data)
      }

      // 处理请求拦截和请求取消两种情况, 默认情况是请求取消，即取消已经发出去的请求
      config = this.handleRequestCancel(config)

      // 根据后台的要求可以返回格式化的json
      config.url = `${config.url}`

      return config
    }, (error) => {
      // 对请求错误做些什么
      errorHandle(error)
      return Promise.reject(error)
    })

    // 响应拦截器
    instance.interceptors.response.use((res) => {
      this.handleResponseCancel()

      // axios正常响应
      if (res.status === 200) {
        return Promise.resolve(res.data)
      }

      return Promise.reject(res)
    }, (error) => {
      // 对响应错误做点什么
      errorHandle(error)
      return Promise.reject(error)
    })
  }

  /**
   *处理请求拦截和请求取消
   * @param {Object} config axios配置对象
   * @return {Object} 返回axios配置对象
   * @memberof HttpRequest
   */
  handleRequestCancel(config: FetchConfig): FetchConfig {
    // 请求取消还是拦截请求的标识
    const { isIntercept } = config

    // 设置本次请求的key
    const { setKey, getKey } = this.cancelKeyManager()
    setKey(config, isIntercept)
    const key = getKey()
    const CancelToken = axios.CancelToken

    // 取消已经发出去的请求
    if (!isIntercept) {
      this.removeRequest(key, true)
      // 设置本次请求的cancelToken
      config.cancelToken = new CancelToken(c => {
        this.pending[key] = c
      })
    } else {
      // 拦截本次请求
      config.cancelToken = new CancelToken(c => {
        // 将本次的cancel函数传进去
        this.removeRequest(key, true, c)
      })
    }

    return config
  }

  /**
   * 处理响应pending
   */
  handleResponseCancel(): void {
    // 获取本次请求的key
    const key = this.cancelKeyManager().getKey()
    // 清除pending中保存的key,来表明这个请求已经响应
    this.removeRequest(key, false)
  }

  /**
   * 移除请求
   * @param {String} key 标识请求的key
   * @param {Boolean} [isRequest=false] 标识当前函数在请求拦截器调用还是响应拦截器调用
   * @param {Function} c cancel函数
   * @memberof HttpRequest
   */
  removeRequest(key: string, isRequest = false, c?: Canceler): void {
    // 请求前先判断当前请求是否在pending中，如果存在有两种情况：
    // 1. 上次请求还未响应，本次的请求被判为重复请求，则调用cancel方法拦截本次重复请求或者取消上一个请求
    // 2. 上次请求已经响应，在response中被调用，清除key
    if (this.pending[key]) {
      if (isRequest) {
        const msg = '您的操作过于频繁,请您稍后再试'
        c ? c(msg) : this.pending[key](msg)
      } else {
        // 上一次请求在成功响应后调用cancel函数删除key
        delete this.pending[key]
      }
    }
  }

  /**
   * get方法封装
   * @param {String} url 请求地址
   * @param {Object} query 请求参数
   * @param {Object} config 请求配置
   * @return {AxiosPromise}
   * @memberof HttpRequest
   */
  get(url: string, query: any, config: FetchConfig = {}): AxiosPromise {
    return this.createAxiosInstance({
      url,
      method: 'get',
      params: query,
      ...config
    })
  }

  /**
   * post方法封装
   * @param {String} url 请求地址
   * @param {Object} data 请求体数据
   * @param {Object} config 请求配置
   * @return {AxiosPromise}
   * @memberof HttpRequest
   */
  post(url: string, data: any, config: FetchConfig = {}): AxiosPromise {
    return this.createAxiosInstance({
      url,
      method: 'post',
      data,
      ...config
    })
  }
}

export default HttpRequest
