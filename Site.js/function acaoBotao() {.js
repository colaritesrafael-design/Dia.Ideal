'user strict'

async function pesquisarClima(cidade){
    const url = `https://api.weatherapi.com/v1/current.json?key=83a36ed654224857a28221157251410&q=Guarapuava&aqi=no`
    const response = await fetch(url)
    const  data = await response.json()
    return data
}

async function prencherFormulario(evento) {

    if(evento.key === "Enter"){
        const cidade = evento.target.value
        const  info = await pesquisarClima(cidade)
        console.log (info)

        document.getElementById('wearther-image')
            .src = info.current.condition.icon.replaceall(64,128) 
        document.getElementById('weather-temperature')  
            .textContent = info.current.temp_c  
    } 
}

document.getElementById('weather-search')
    .addEventListener('keypress',  prencherFormulario)
