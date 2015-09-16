# fis3 静态资源七牛 部署插件

FIS 部署七牛云存储插件，提供静态资源部署能力，CDN加速。

## 安装

全局安装或者本地安装都可以。

```
npm install fis3-deploy-qiniu or npm install fis3-deploy-qiniu -g
```

## 使用方法

也可以使用统一的 deploy 插件配置方法

```js
fis.match('*.js', {
    deploy: fis.plugin('qiniu', {
        accessKey: '',  //Your qiniu Access Key
        secretKey: '',  //Your qiniu Secret Key
        bucket: 'my-test-bucket'
    })
})
```
