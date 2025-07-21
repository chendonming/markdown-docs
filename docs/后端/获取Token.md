# 获取Token

> ```url
> POST /api/auth/authentication
> ```

## 说明

在调用其他API之前，必须先获取Token。

Token代表了用户当前应用的身份，根据应用id和key来获取Token。用户可以通过Token对自己应用内的文件发起文件上传、下载、删除、模型转换、模型集成、模型对比等操作，同时也能访问所有的数据接口获取轻量化后的模型信息。

Token有效期为12小时，12小时内该Token不会发生改变。

## 参数
Body
| 名称         | 说明     | 类型   |
| ------------ | --------------- |------  |
| clientId     | 应用的AppKey    | string |
| clientSecret | 应用的AppSecret | string |

## 响应

| 名称         | 说明     | 类型   |
| ------------ | -------- | ------ |
| code         | 返回码   | string |
| msg          | 提示消息 | string |
| data         | 返回数据 | json   |
| traceId      | 链路id   | string |
| responseTime | 响应时间 | string |

## 返回数据

| 名称              | 说明              | 类型   |
| ----------------- | ----------------- | ------ |
| accessToken       | Token             | string |
| accessTokenBearer | Bearer类型的Token | string |
| tokenType         | Token类型         | string |
| expiresIn         | 过期时间          | string |

## 请求示例

##### 请求 path

> http://119.39.38.228:9986/api/auth/authentication

请求参数

```json
{
    "clientId": "",
    "clientSecret":""
}
```



## 响应示例

```json
{
  "code": "00000",
  "msg": "请求成功",
  "data": {
    "accessToken": "",
    "accessTokenBearer": "",
    "tokenType": "Bearer",
    "expiresIn": "43199"
  },
  "traceId": null,
  "responseTime": "2023-06-12 15:54:08.930"
}
```

