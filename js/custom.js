const targetDate = new Date("2023-06-08T14:30:37"); // 指定时间
// 计算时间
function TimeCalculation () {
    let time = {
        diffInDays: 0,
        diffInHours: 0,
        diffInMinutes: 0,
        diffInSeconds: 0,
    }
    const currentDate = new Date(); // 当前时间
    const diffInMilliseconds = Math.abs(targetDate - currentDate); // 计算差值(单位为毫秒)
    const date = new Date(diffInMilliseconds); // 创建一个表示指定时间的Date对象
    time.diffInDays = Math.floor(date.getTime() / (24 * 60 * 60 * 1000)); // 计算天数差值
    time.diffInHours = Math.floor(
        (date.getTime() % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
    ); // 计算小时差值
    time.diffInMinutes = Math.floor(
        (date.getTime() % (60 * 60 * 1000)) / (60 * 1000)
    ); // 计算分钟差值
    time.diffInSeconds = Math.floor(
        (date.getTime() % (60 * 1000)) / 1000
    ); // 计算秒差值
    return time
}
const footer = document.querySelector('footer')
footer.innerHTML = ''
let my_div = document.createElement('div')
my_div.innerHTML = `
    <div>本站已运行： <span>${TimeCalculation().diffInDays}</span> 天 <span>${TimeCalculation().diffInHours}</span> 时 <span>${TimeCalculation().diffInMinutes}</span> 分 <span>${TimeCalculation().diffInSeconds}</span> 秒 </div>`
footer.appendChild(my_div);

function updateDom(){
    if(my_div.children[0].children.length){
        my_div.children[0].children[0].textContent = TimeCalculation().diffInDays
        my_div.children[0].children[1].textContent = TimeCalculation().diffInHours
        my_div.children[0].children[2].textContent = TimeCalculation().diffInMinutes
        my_div.children[0].children[3].textContent = TimeCalculation().diffInSeconds
    }
}
setInterval(updateDom,1000)
