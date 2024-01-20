/**
 * @ConfigName Surfboard-Config-Mix
 * @Author @wddclass
 * @UpdateDate 2024/1/20
 * 
 * 通过 {param_template_url} 地址栏参数传入Surfboard模板
 * 将 订阅链接或 Sub-Store 订阅链接替换到 'policy-path'
 * 达到 Surfboard 配合 Sub-Store，并在 Surfboard 客户端中显示订阅信息的效果
 * 
 * @param {string} template Surfboard 配置模板
 * @param {string} name 将会在 Surfboard 客户端上显示的订阅名称
 * @param {string} url 机场订阅链接或 Sub-Store 订阅链接
 */

export default {
	async fetch(request) {

		const urlParams = new URL(request.url).searchParams
		const param_template_url = urlParams.get('template')
		const param_file_name = urlParams.get('name')
		const param_url = urlParams.get('url')

		if (!param_template_url) {
			return new Response('请传入template参数')
		}
		if (!param_file_name) {
			return new Response('请传入name参数')
		}
		if (!param_url) {
			return new Response('请传入url参数')
		}

		const templateResponse = await fetch(param_template_url)
		const template_context = await templateResponse.text()

		const response = await fetch(param_url, {
			headers: {
				"User-Agent": "clash"
			}
		})
		const subscriptionUserinfo = response.headers.get("subscription-userinfo")

		const modifiedHeaders = new Headers()
		modifiedHeaders.set('Content-Type', 'text/plain')
		modifiedHeaders.set('content-disposition', `attachment; filename=${param_file_name}`)

		let surfboard_content = await template_context
		surfboard_content = surfboard_content.replace(/policy-path = .*?,/g, `policy-path = ${param_url},`);
		
		let subList = []
		if (subscriptionUserinfo) {
			subList = subscriptionUserinfo.split(';').map((item) => {
				var parts = item.split("=");
				return { name: parts[0].trim(), value: parts[1] };
			});
			let subUpload = '',
				subDownload = '',
				subTotal = '',
				subDate = '',
				subUsed = ''
			try {
				subUpload = (Number(subList.find(item => item.name == 'upload').value) / (1024 * 1024 * 1024)).toFixed(2)
				subDownload = (Number(subList.find(item => item.name == 'download').value) / (1024 * 1024 * 1024)).toFixed(2)
				subTotal = (Number(subList.find(item => item.name == 'total').value) / (1024 * 1024 * 1024)).toFixed(2)
				subDate = formatDate(Number(subList.find(item => item.name == 'expire').value) * 1000)
				subUsed = (Number(subUpload) + Number(subDownload)).toFixed(2)
				// let subDate = subList.find(item => item.name == 'expire').value
			} catch { }


			let SubscribeInfo = `上传流量：${subUpload}GB\\n下载流量：${subDownload}GB\\n已用流量：${subUsed}GB\\n套餐流量：${subTotal}GB\\n到期时间：${subDate}`
			let PanelInfo = `SubscribeInfo = title=${param_file_name}订阅信息, content=${SubscribeInfo}, style=info\n`

			surfboard_content = surfboard_content.replace(/SubscribeInfo.*/, PanelInfo);
		}
		surfboard_content = surfboard_content.replace(/^.*/, `#!MANAGED-CONFIG ${param_template_url} interval=43200 strict=true`)

		return new Response(surfboard_content)

		function formatDate(timestamp) {
			var date = new Date(timestamp);

			var year = date.getFullYear();
			var month = ("0" + (date.getMonth() + 1)).slice(-2);
			var day = ("0" + date.getDate()).slice(-2);
			var hours = ("0" + date.getHours()).slice(-2);
			var minutes = ("0" + date.getMinutes()).slice(-2);
			var seconds = ("0" + date.getSeconds()).slice(-2);

			var formattedDate = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;

			return formattedDate
		}
	},
};