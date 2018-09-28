//Importacion e inicializacion del servidor
const express = require('express')
const app = express()
//Utilizacion de bodyparser para pasar informacion en formularios y archivos json que vengan desde la url
const bodyParser = require('body-parser')
//Uso de fileupload para subir archivos al Servidor
const fileUpload = require('express-fileupload')
// Uso de crypto para desencriptar mamadas
const crypto = require('crypto');
// Uso para re convertir archivos
const fs = require('fs');


// Declaracion de que toda lo que contenga la carpeta public, será accesible por parte del cliente
app.use(express.static('public'))
//Declaracion para que express utilice vody-parser en json y formularios
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
//Declaracion para que express use fileUpload
app.use(fileUpload())
// Aqui se asigna que usara viestas dinamicas en vez de paginas fjas de html
app.set('view engine', 'pug')
// Establecimiento del puerto para el servidor en 8080
app.listen(8080, () => {
    console.log('Servidor Inicializado')
})
// Aqui, aparte de ejecutar a layout.pug ejecutara a la viesta index, dentro de layout
app.get('/', (req, res) => {
    res.render('index')
})

app.post('/crypt',(req,res) =>
{
    let file = req.files.file
    let key = req.body.key
    // Validacion section
    console.log('aida');
    let ok = valFile(file)
    console.log(ok);
    if (!ok) res.render('error')
    else
    {
        ok = valKey(key)
        console.log(ok);
        if (!ok) res.render('error')
        else
        {
            console.log("El original en Buffer es: "+ file.data)

            var cipher = crypto.createCipher('DES-ECB', key)
            var cry = cipher.update(file.data, 'utf8', 'hex')
            try
            {
              cry += cipher.final('hex')
            } catch (e) {
              console.log(e);
              console.log('Algo salio mal');
              res.render('error')
            }
            console.log("El encriptado en Buffer es: "+ cry)

            fs.writeFile(`${file.name}`, cry, 'hex', (err) =>
            {
                if (err) throw err
                res.download(`${file.name}`, file.name, () =>
                {
                    fs.unlink(`${file.name}`, (err) =>
                    {
                        if (err) throw err
                        console.log('Archivo eliminado del servicio')
                    })
                })
            })
        }
    }


    //https://nodejs.org/api/crypto.html#crypto_class_cipher
})

app.post('/decrypt',(req,res) =>
{
    let file = req.files.file
    let key = req.body.key

    let ok = valFile(file)
    if (!ok)
        res.render('error')
    else
    {
        ok = valKey(key)
        if (!ok) res.render('error')
        else
        {
            console.log("El original en Buffer es: "+ file.data)

            console.log('Compila')
            var decipher = crypto.createDecipher('DES-ECB', key)
            console.log('Seguro?')
            var dec = decipher.update(file.data, 'hex', 'utf8')
            console.log('Si')
            try
            {
              dec += decipher.final('utf8')
            } catch (e) {
              console.log(e);
              console.log('Algo salio mal');
              res.render('error')
            }
            console.log("El desencriptado en Buffer es: "+ dec)

            fs.writeFile(`${file.name}`, dec, 'utf8', (err) =>
            {
                if (err) throw err
                res.download(`${file.name}`, file.name, () =>
                {
                    fs.unlink(`${file.name}`, (err) =>
                    {
                        if (err) throw err

                        console.log('Archivo eliminado del servicio')
                    })
                })
            })
        }
    }

})


function valFile(file)
{
    let extension = file.name.substring(file.name.lastIndexOf('.')+1, file.name.length)
    console.log(`La extension es: ${extension}`)
    return (extension == 'txt')? true : false
}

function valKey(key)
{
    let patron = /[\w .]{8}/
    console.log('La key cumple ?:' + patron.test(key))
    return patron.test(key)
}
