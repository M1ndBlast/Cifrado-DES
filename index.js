//                              Importacion de modulos de node a ocupar en este archivo

// Importacion e inicializacion del servidor
const express = require('express')
//Utilizacion de bodyparser para pasar informacion en formularios y archivos json que vengan desde la url
const bodyParser = require('body-parser')
// Uso de fileupload para subir archivos al Servidor
const fileUpload = require('express-fileupload')
// Uso de crypto para desencriptar mamadas
const crypto = require('crypto');
// Uso para re convertir archivos
const fs = require('fs');


//                    Declaracion de variables y funciones que ocupara el servidor que nos povee Express

// Declaracion e inicializacion del servidor Express
const app = express()
// Asignacion de carpeta publica a la cual los usuarios del servidor pueden acceder
app.use(express.static('public'))
// Asignacion de body-parser en el servidor para que se puedan "Atrapar" los valores mandados atraves de la url y de los archivos .json
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
// Asignacion de fileupload para poder subir archivos al servidor por parte del cliente
app.use(fileUpload())
// Declaracion y asignacion de la clase de vistas dinamicas que se va ocupar
app.set('view engine', 'pug')
// Asignacion del puerto por el que el servidor escuchara las solicitudes del cliente (Es forsozo elegir uno, no puedeescuchar por cualquier puerto)
var port = 8080
app.listen(port, () =>
{
    console.log('Servidor Inicializado \n Disponible en: \n \t http://localhost:'+port+'/')
})
// Asignacion del archivo index, que utiliza como "plantilla"/"archivo padre" el archivo layout en la url: NAMEHOST+/
app.get('/', (req, res) =>
{
    res.render('index')
})

// Asignacion del proceso para cifrar un archivo en la url: NAMEHOST+/crypt
app.post('/crypt',(req,res) =>
{
    // Obtencion de los parametros mandados del form en '/'
    let file = req.files.file
    let key = req.body.key
    // Verificacion de que sea un archivo en terminacion .txt
    console.log('aida');
    let ok = valFile(file)
    console.log(ok);
    if (!ok) res.render('error')
    else
    {
        // Verificacion de que sea un una llave exactamente de 8 caracteres para formar un bloque de 64bits
        ok = valKey(key)
        console.log(ok);
        if (!ok) res.render('error')
        else
        {
            console.log("El original en Buffer es: "+ file.data)
            // Creacion del objto cifrador por medio del algoritmo DES
            var cipher = crypto.createCipher('DES-ECB', key)
            // cifrado del buffer del archvio mandado donde cambiara de un formato uft-8  a hexadecimal
            var cry = cipher.update(file.data, 'utf8', 'hex')
            // Uso de  try-catch en para atrapar error en caso de que ingrese una clave erronea (En este caso no adecuada)
            let ok = true
            try
            {
                cry += cipher.final('hex')
            }
            catch (e)
            {
                console.log(e);
                console.log('Algo salio mal');
                let ok = false;
                res.render('error')
            }
            // Si no se mando un error del cifrado siga con el proceso
            if (ok)
            {
                console.log("El encriptado en Buffer es: "+ cry)

                //                      Proceso para descargar el archivo, ahora encriptado

                // Escribir los datos (cry) en un directorio (`${file.name}`) utilizando un formato hexadecimal
                fs.writeFile(`${file.name}`, cry, 'hex', (err) =>
                {
                    if (err) throw err
                    // Descargar el archivo que fue guardado en el mismo directorio anterior
                    res.download(`${file.name}`, file.name, () =>
                    {
                        // Eliminar el archivo que se encuentra en el directorio anterior para no dejar registro del encriptado y ademas no saturar el almacenamiento
                        fs.unlink(`${file.name}`, (err) =>
                        {
                            if (err) throw err
                            console.log('Archivo eliminado del servicio')
                        })
                    })
                })
            }
        }
    }


})

// Asignacion del proceso para descifrar un archivo en la url: NAMEHOST+/decrypt
// repoyo del /crypt pero sustituyendo  cifrado por descifrado y partiendo de un hex a un utf-8
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

            var decipher = crypto.createDecipher('DES-ECB', key)
            var dec = decipher.update(file.data, 'hex', 'utf8')
            // Uso de  try-catch en para atrapar error en caso de que ingrese una clave erronea (Que no sea la misma llave con la que se encipto)
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

// Funcion para validar que la terminacion del archivo es unicamente txt
function valFile(file)
{
    let extension = file.name.substring(file.name.lastIndexOf('.')+1, file.name.length)
    console.log(`La extension es: ${extension}`)
    return (extension == 'txt')? true : false
}
// Funcion para validar que la llave de encriptacion cumple con un formato estandar y no tenga caracteres desconocidos
function valKey(key)
{
    let patron = /[\w .]{8}/
    console.log('La key cumple ?:' + patron.test(key))
    return patron.test(key)
}

// more info en:
//https://nodejs.org/api/crypto.html#crypto_class_cipher
