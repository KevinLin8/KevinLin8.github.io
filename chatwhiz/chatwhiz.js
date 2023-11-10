console.log(`-----------加载js脚本文件-----------${new Date()}`);
var chatpdfLine = document.getElementById('chatpdfLine');
var textarea = document.getElementById('textArea');
function autoResizeTextarea (element) {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
}
// 获取 textarea 元素
// 监听输入事件，当有输入时自动调整高度
textarea.addEventListener('input', function () {
    autoResizeTextarea(this);
});
// 页面加载完成后初始化 textarea 的高度
window.addEventListener('load', function () {
    autoResizeTextarea(textarea);
});
// chatwhiz
const APPID = '0737ef21';
const API_SECRET = 'N2I0ZWViM2M3MDdlYTkyMTAzZTNhODE3';
const API_KEY = '93cc1c69fec144cd075974bcac7a384c';
var total_res = "";
// 请求参数
var params = {
    "header": {
        "app_id": APPID,
        "uid": "linxiao"
    },
    "parameter": {
        "chat": {
            "domain": "general",
            "temperature": 0.5,
            "max_tokens": 1024
        }
    },
    "payload": {
        "message": {
            "text": []
        }
    }
}
// 实现HmacSHA256加密签名
// async function calculateHmacSHA256 (key, message) {
//     const encoder = new TextEncoder();
//     let base64Signature;
//     await crypto.subtle.importKey(
//         'raw',
//         encoder.encode(key),
//         { name: 'HMAC', hash: { name: 'SHA-256' } },
//         false,
//         ['sign']
//     )
//         .then(key => {
//             return crypto.subtle.sign('HMAC', key, encoder.encode(message));
//         })
//         .then(signature => {
//             base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));
//         })
//         .catch(error => {
//             console.error(error);
//         });
//     return base64Signature
// }

// 获取请求地址
async function getWebsocketUrl () {
    return new Promise(async (resolve, reject) => {
        var apiKey = API_KEY
        var apiSecret = API_SECRET
        var url = 'wss://spark-api.xf-yun.com/v1.1/chat'
        var host = location.host
        var date = new Date().toGMTString()
        var algorithm = 'hmac-sha256'
        var headers = 'host date request-line'
        var signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v1.1/chat HTTP/1.1`
        var signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret);
        var signature = CryptoJS.enc.Base64.stringify(signatureSha);
        var authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`
        var authorization = btoa(authorizationOrigin)
        url = `${url}?authorization=${authorization}&date=${date}&host=${host}`
        resolve(url)
    })
}
class TTSRecorder {
    constructor({
        appId = APPID
    } = {}) {
        this.appId = appId
        this.status = 'init'
    }
    // 修改状态
    setStatus (status) {
        this.onWillStatusChange && this.onWillStatusChange(this.status, status)
        this.status = status
    }
    // 连接websocket
    connectWebSocket () {
        this.setStatus('ttsing')
        return getWebsocketUrl().then(url => {
            let ttsWS
            if ('WebSocket' in window) {
                ttsWS = new WebSocket(url)
            } else if ('MozWebSocket' in window) {
                ttsWS = new MozWebSocket(url)
            } else {
                alert('浏览器不支持WebSocket')
                return
            }
            this.ttsWS = ttsWS
            ttsWS.onopen = e => {
                this.webSocketSend()
            }
            ttsWS.onmessage = e => {
                this.result(e.data)
            }
            ttsWS.onerror = e => {
                clearTimeout(this.playTimeout)
                this.setStatus('error')
                alert('WebSocket报错，请f12查看详情')
                console.error(`详情查看：${encodeURI(url.replace('wss:', 'https:'))}`)
            }
            ttsWS.onclose = e => {
            }
        })
    }
    // websocket发送数据
    webSocketSend () {
        this.ttsWS.send(JSON.stringify(params))
    }
    start () {
        total_res = ""; // 请空回答历史
        this.connectWebSocket()
    }
    // websocket接收数据的处理
    result (resultData) {
        let jsonData = JSON.parse(resultData)
        total_res += jsonData.payload.choices.text[0].content
        if (jsonData.header.status == 0) {
            let chatBox = document.createElement('div')
            let textBox = document.createElement('pre')
            let img = document.createElement('img')
            img.src = '/img/ai.jpg'
            textBox.classList.add('chatpdfContent')
            textBox.textContent = total_res
            chatBox.appendChild(img)
            chatBox.appendChild(textBox)
            chatBox.classList.add('chatpdfRow','assistant')
            chatpdfLine.appendChild(chatBox)
        }
        var lastChild = chatpdfLine.lastElementChild;
        lastChild.children[1].textContent = total_res
        // 提问失败
        if (jsonData.header.code !== 0) {
            alert(`提问失败: ${jsonData.header.code}:${jsonData.header.message}`)
            console.error(`${jsonData.header.code}:${jsonData.header.message}`)
            return
        }
        if (jsonData.header.code === 0 && jsonData.header.status === 2) {
            params.payload.message.text.push({
                "role": "assistant",
                "content": total_res
            })
            this.ttsWS.close()
            this.setStatus("init")
        }
    }
}
let bigModel = new TTSRecorder()
// ======================开始调用=============================
function requestOnlineConnection () {
    let chatBox = document.createElement('div')
    let textBox = document.createElement('div')
    let img = document.createElement('img')
    img.src = '/img/user.webp'
    textBox.classList.add('chatpdfContent')
    textBox.textContent = textarea.value
    chatBox.appendChild(textBox)
    chatBox.appendChild(img)
    chatBox.classList.add('chatpdfRow', 'chatpdfAsk')
    chatpdfLine.appendChild(chatBox)
    params.payload.message.text.push({
        "role": "user",
        "content": textarea.value
    })
    bigModel.start()
    textarea.value = ''
    textarea.style.height = 'auto';
}
send.addEventListener('click', function (event) {
    requestOnlineConnection()
});
// 页面刷新恢复聊天数据
let elementAsString = sessionStorage.getItem("chat_message");
if (chatpdfLine.children.length == 1 && elementAsString) {
    chatpdfLine.innerHTML = JSON.parse(elementAsString).element
}
window.addEventListener('beforeunload', function(event) {
if(chatpdfLine.children.length > 1){
sessionStorage.setItem('chat_message',JSON.stringify({element:chatpdfLine.innerHTML}))
}
  event.preventDefault();
  event.returnValue = '';  // 为了兼容旧版本的浏览器
});