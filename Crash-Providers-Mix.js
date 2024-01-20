/**
 * @ConfigName Clash-Providers-Mix
 * @Author @wddclass
 * @UpdateDate 2024/1/19
 * 
 * 通过 {param_template_url} 地址栏参数传入clash模板，替换 {urlKey} 关键词
 * 将 订阅链接或 Sub-Store 订阅链接替换到 'proxy-providers'中的 url
 * 达到 Clash 配合 Sub-Store，并在 Clash 客户端中显示订阅信息的效果
 * 
 * @param {string} template Clash 配置模板
 * @param {string} urlKey Clash 配置模板中的'proxy-providers'的 url 参数
 * @param {string} name 将会在 Clash 客户端上显示的订阅名称
 * @param {string} url 机场订阅链接或 Sub-Store 订阅链接
 */
export default {
  async fetch(request) {
    const urlParams = new URL(request.url).searchParams
    const param_template_url = urlParams.get('template')
    const param_url_key = urlParams.get('urlKey')
    const param_file_name = urlParams.get('name')
    const param_url = urlParams.get('url')

    if (!param_template_url) {
      return new Response('请传入template参数')
    }
    if (!param_url_key) {
      return new Response('请传入urlKey参数')
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
        "User-Agent": "clash-verge/v1.4.5"
      }
    })
    const subscriptionUserinfo = response.headers.get("subscription-userinfo")

    const modifiedHeaders = new Headers()
    modifiedHeaders.set('Content-Type', 'text/plain')
    modifiedHeaders.set('content-disposition', `attachment; filename=${param_file_name}`)
    modifiedHeaders.set("subscription-userinfo", subscriptionUserinfo)

    let clash_content = await template_context
    clash_content = clash_content.replace(param_url_key, param_url)
    clash_content = clash_content.replaceAll('Subscribe', param_file_name)

    return new Response(clash_content, {
      headers: modifiedHeaders
    })
  },
};
