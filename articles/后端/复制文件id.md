# 创建应用目录

> ```url
> POST /api/convert/bim-file/copyFile
> ```

## 说明

在指定应用和对应目录下创建子目录，如需要创建根目录则不需要传上级目录名称。

## 参数
Header
| 名称         | 说明     | 类型   |
| ------------ | --------------- |------  |
| Authorization     | Bearer {Token}    | string |

Body
| 名称         | 说明     | 类型   |
| ------------ | --------------- | ------ |
| fileId | 文件id | string |
| num | 复制记录条数 大于或等于1 | Integer |


## 响应

| 名称         | 说明     | 类型   |
| ------------ | -------- | ------ |
| code         | 返回码   | string |
| msg          | 提示消息 | string |
| data         | 返回数据 | json   |
| traceId      | 链路id   | string |
| responseTime | 响应时间 | string |

## 返回数据
| 名称      | 说明 | 类型       |
|---------|--|----------|
| fileIds | 复制的文件id数组 | string[] |



## 请求示例

##### 请求 path

> http://119.39.38.228:9986/api/convert/bim-file/copyFile

请求参数

```json
{
    "fileId": "",
    "num": 2
}
```

## 响应示例

```json
{
	"code": "00000",
	"msg": "请求成功",
	"data": "111111,22222",
	"traceId": "",
	"responseTime": ""
}
```


