/**
 * fis3-deploy-qiniu
 */

// 引入七牛 Node.js SDK
var qiniu = require('qiniu');

/**
 * 生成上传凭证并返回
 */
function getUptoken(bucketname) {
	var putPolicy = new qiniu.rs.PutPolicy(bucketname);
	return putPolicy.token();
}

/**
 * 直接上传二进制流
 */
function uploadBuf(uptoken, release, content, file, callback) {
	var subpath = file.subpath;
 	var objkey = release.replace(/^\//, '');
  	var extra = new qiniu.io.PutExtra();
 	if(file.isJsLike)
	{
		extra.mimeType = "application/javascript";
	}
	if(file.isCssLike)
	{
		extra.mimeType = "text/css";
	}

	qiniu.io.put(uptoken, objkey, content, extra, function(err, ret) {
		if(err){
            console.log('error:', err);
            callback(err);
        } else {
            var time = '[' + fis.log.now(true) + ']';
            process.stdout.write(
                ' uploadQiniu - '.green.bold +
                time.grey + ' ' + 
                subpath.replace(/^\//, '') +
                ' >> '.yellow.bold +
               	ret.key + '\n'
            );
            callback();
        }
	});
}

/**
 * deploy-qiniu 插件接口
 * @param  {Object}   options  插件配置
 * @param  {Object}   modified 修改了的文件列表（对应watch功能）
 * @param  {Object}   total    所有文件列表
 * @param  {Function} next     调用下一个插件
 * @return {undefined}
 */
module.exports = function(options, modified, total, callback, next) {
	if (!options.accessKey && !options.secretKey) {
		throw new Error('options.accessKey and options.secretKey is required!');
	} else if (!options.bucket) {
		throw new Error('options.bucket is required!');
	}
	qiniu.conf.ACCESS_KEY = options.accessKey;
	qiniu.conf.SECRET_KEY = options.secretKey;
	qiniu.conf.UP_HOST = options.UP_HOST || qiniu.conf.UP_HOST

	var steps = [];

	modified.forEach(function(file) {
		var reTryCount = options.retry;
		var keyname = file.getHashRelease().replace(/^\//, '');
		var uptoken = getUptoken(options.bucket+':'+keyname);
		steps.push(function(next) {
		  	var _upload = arguments.callee;

		  	uploadBuf(uptoken, file.getHashRelease(), file.getContent(), file, function(error){
		  		if (error) {
			      	if (!--reTryCount) {
			        	throw new Error(error);
			      	} else {
			        	_upload();
			      	}
			    } else {
			      	next(); //由于是异步的如果后续还需要执行必须调用 next
			    }
		  	});
		});
	});
	fis.util.reduceRight(steps, function(next, current) {
		return function() {
			current(next);
		};
	}, callback)();
};

module.exports.options = {
  // 允许重试两次。
  retry: 2
};
