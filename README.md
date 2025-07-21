这是一个用于在线浏览markdown的仓库，适用于简单访问markdown，只需要nginx。

# 优点

相比较于SPA，使用webpack、vite等构建，此仓库使用纯web搭建，没有任何构建工具，且只依赖一个可以提供文件结构的API，

在nginx中此API，通过`autoindex_format json`指令可以轻松获取。

# 配置

目前默认的目录是`articles`，nginx配置如下(二级目录为docs):
```
	server {
		listen 80;
		server_name localhost; # 请替换成你的域名或 IP 地址

		# 匹配 /docs/articles/ 路径，并返回 JSON 格式的文件列表
		location /docs/articles/ {
			alias /var/01_Projects/markdown-docs/articles/;
			add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0";
    		add_header Pragma "no-cache";
    		add_header Expires "0";

			autoindex on;
			autoindex_format json;
			autoindex_exact_size off;
		}

		# 匹配所有以 /docs/ 开头的请求
		location /docs/ {
			alias /var/01_Projects/markdown-docs/;

			index index.html;
			try_files $uri $uri/ =404;
		}
	}
```
