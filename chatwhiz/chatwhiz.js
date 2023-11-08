document.addEventListener('DOMContentLoaded', function () {
    var chatpdfLine = document.getElementById('chatpdfLine');
    function autoResizeTextarea (element) {
        element.style.height = 'auto';
        element.style.height = element.scrollHeight + 'px';
    }
    // 获取 textarea 元素
    var textarea = document.getElementById('textArea');
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


    // start
    async function calculateHmacSHA256 (key, message) {
        const encoder = new TextEncoder();
        let base64Signature;
        await crypto.subtle.importKey(
            'raw',
            encoder.encode(key),
            { name: 'HMAC', hash: { name: 'SHA-256' } },
            false,
            ['sign']
        )
            .then(key => {
                return crypto.subtle.sign('HMAC', key, encoder.encode(message));
            })
            .then(signature => {
                base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));

            })
            .catch(error => {
                console.error(error);
            });
        return base64Signature
    }


    // end
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
            var signatureSha = await calculateHmacSHA256(apiSecret, signatureOrigin)
            var signature = signatureSha;
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
                    console.log(e)
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
                let textBox = document.createElement('div')
                let img = document.createElement('img')
                img.src = '/img/ai.jpg'
                textBox.classList.add('chatpdfContent')
                textBox.textContent = total_res
                chatBox.appendChild(img)
                chatBox.appendChild(textBox)
                chatBox.classList.add('chatpdfRow')
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
                console.log(params.payload.message.text);
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
        console.log(params.payload.message.text);
        bigModel.start()

    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            requestOnlineConnection()
        }
    });
    send.addEventListener('click', function (event) {
        requestOnlineConnection()
    });


});

