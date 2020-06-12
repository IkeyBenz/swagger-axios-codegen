import * as fs from 'fs'
import * as path from 'path'
import { ISwaggerOptions } from "../baseInterfaces";
import { abpGenericTypeDefinition, universalGenericTypeDefinition } from './genericTypeDefinitionTemplate';
import { trimString } from '../utils';

export function serviceHeader(options: ISwaggerOptions, basePath: string) {
  const classTransformerImport = options.useClassTransformer
    ? `import { Expose, Transform, Type, plainToClass } from 'class-transformer';
  ` : '';
  return `/** Generate by swagger-axios-codegen */
  // tslint:disable
  /* eslint-disable */
  import axiosStatic, { AxiosInstance } from 'axios';
  import { encode as base64Encode } from 'base-64';
  import { store } from '../store';
  import { encodeForm } from '../util/apiHelper';
  import { updateAuth } from '../store/actions/auth';

  const basePath = '${trimString(basePath, '/', 'right')}'
  const client_id = 'mergg_mobile';
  const client_secret = 'secret';
  ${classTransformerImport}

  export interface IRequestOptions {
    headers?: any;
    baseURL?: string;
    responseType?: string;
  }

  export interface IRequestConfig {
    method?: any;
    headers?: any;
    url?: any;
    data?: any;
    params?: any;
  }

  // Add options interface
  export interface ServiceOptions {
    axios?: AxiosInstance,
  }

  ${requestHeader()}
  ${definitionHeader(options.extendDefinitionFile)}
  `;
}



export function customerServiceHeader(options: ISwaggerOptions, basePath: string) {

  return `/** Generate by swagger-axios-codegen */
  // tslint:disable
  /* eslint-disable */
  export interface IRequestOptions {
    headers?: any;
  }

  export interface IRequestPromise<T=any> extends Promise<IRequestResponse<T>> {}

  export interface IRequestResponse<T=any> {
    data: T;
    status: number;
    statusText: string;
    headers: any;
    config: any;
    request?: any;
  }

  export interface IRequestInstance {
    (config: any): IRequestPromise;
    (url: string, config?: any): IRequestPromise;
    request<T = any>(config: any): IRequestPromise<T>;
  }

  export interface IRequestConfig {
    method?: any;
    headers?: any;
    url?: any;
    data?: any;
    params?: any;
  }

  const basePath = '${basePath}'

  // Add options interface
  export interface ServiceOptions {
    axios?: IRequestInstance,
  }

  ${requestHeader()}
  ${definitionHeader(options.extendDefinitionFile)}
  `
}

function requestHeader() {
  return `

  // Add default options
  export const serviceOptions: ServiceOptions = {
    axios: axiosStatic,
  };

  // Instance selector
  export function axios(configs: IRequestConfig, resolve: (p: any) => void, reject: (p: any) => void): Promise<any> {
    if (serviceOptions.axios) {
      const {
        auth: { tokenData }
      } = store.getState() as RootState;

      if (tokenData) {
        configs.headers.Authorization = \`Bearer \${tokenData.access_token}\`;
      }
  
      return serviceOptions.axios
        .request(configs)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          // Had a token but expired, refresh it and remake intended api call
          if (err.response.status === 401 && tokenData) {
            return refreshAccessToken(tokenData.refresh_token).then(() => {
              return axios(configs, resolve, reject);
            });
          }
          reject(err);
        });
    } else {
      throw new Error('please inject yourself instance like axios  ');
    }
  }
  
  const refreshAccessToken = (() => {
    let currRequest: Promise<void> | null = null;
    const oneAtATimeRefreshToken = (refreshToken: string) => {
      if (!currRequest) {
        console.log('refreshing token!', refreshToken);
        currRequest = axiosStatic.post(
          \`\${basePath}/oauth/token\`,
          encodeForm({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          }),
          {
            headers: {
              Authorization: \`Basic \${base64Encode(
                \`\${client_id}:\${client_secret}\`,
              )}\`,
              'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
              Accept: 'application/json',
            },
          },
        );
      }
      return currRequest
        .then(newTokenData => {
          store.dispatch(updateAuth(newTokenData));
        })
        .finally(() => (currRequest = null));
    };
    return oneAtATimeRefreshToken;
  })();

  export function getConfigs(method: string, contentType: string, url: string,options: any):IRequestConfig {
    url = basePath + url
    const configs: IRequestConfig = { ...options, method, url };
    configs.headers = {
      ...options.headers,
      'Content-Type': contentType,
    };
    return configs
  }
  `
}

function definitionHeader(fileDir: string | undefined) {
  let fileStr = '// empty '
  if (!!fileDir) {
    console.log('extendDefinitionFile url : ', path.resolve(fileDir))
    if (fs.existsSync(path.resolve(fileDir))) {
      const buffs = fs.readFileSync(path.resolve(fileDir))
      fileStr = buffs.toString('utf8')
    }
  }

  return `
  ${universalGenericTypeDefinition()}
  ${abpGenericTypeDefinition()}
  // customer definition
  ${fileStr}
  `
}
