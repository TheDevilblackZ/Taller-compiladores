const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');

// para correr programa n

// ctrl + ñ para abrir terminal

// pd: npm -v (para saber si el npm está instalado en visual) tienes que descargar una extensión en visual estudio de nodeJs

// si ya tienes nodeJs instalado sigue los pasos:
// 1. instalar Express: npm install express
// 2. instalar Mysql : npm install mysql
// 3. instalar body-parser : npm install body-parser
// 4. correr programa: npm listaTareas.js

// iniciar aplicacion
const app = express();
// establecer puerto
const port = 5000;

// formato para manejar solicitudes json
app.use(bodyParser.json());

// establecer configuracion de la base de datos
const dbConexion = mysql.createConnection({
  host:'localhost',
  user:'root',
  password:'',
  database:'tareas'
})

// establecer conexión a la base de datos
dbConexion.connect((error)=>{
  if(error){
    console.error('Error conectado a base de datos: '+ error.message);
  }else{
    console.log('Conectado a la base de datos');
  }

  // crear tabla Tareas si no existe
  const createTable = `CREATE TABLE IF NOT EXISTS tareas(
    id INT AUTO_INCREMENT PRIMARY KEY,
    Titulo VARCHAR(255) NOT NULL,
    Descripcion TEXT,
    Tipo VARCHAR(100) NOT NULL,
    Fecha_expiracion DATE NOT NULL,
    Fecha_creacion DATE NOT NULL,
    Estado ENUM('abierta', 'caducada') NOT NULL DEFAULT 'abierta',
    Prioridad VARCHAR(50) NOT NULL
  )`;
  
  dbConexion.query(createTable,(error)=>{
    if(error){
      console.error('No se pudo crear la tabla: '+ error.message);
    }else{
      console.log('Se ha creado la tabla');
    }
  })

})


// Establecer la carpeta 'static' como carpeta de archivos estáticos
app.use(express.static(path.join(__dirname, '/styles')));


// carga la pagina html
app.get('/index',(req,res)=>{
  res.sendFile(path.join(__dirname, '/templates/index.html'));
})


// trae todas las tareas
app.get('/tareas',(req,res)=>{
  const query = 'SELECT * FROM tareas';

  dbConexion.query(query,(error,result)=>{
    if(error){
      console.error('No se ha podido traer las tareas: '+error.message);
      res.status(500).json({message:'Error al traer datos'});
    } else{
      if(result.length === 0){
        res.json({ mesagge: 'Aun no se han agregado tareas nuevas' });
      }else{
        res.json({ tareas: result });
      }
    }
  })
})

// Endpoint para crear una tarea
app.post('/crear/tarea', (req, res) => {
  const tarea = req.body; // Obtiene los datos JSON del cuerpo de la solicitud
  console.log(tarea);
  // Verifica si algún campo obligatorio está vacío
  if (!tarea.Titulo || !tarea.Descripcion || !tarea.Tipo || !tarea.Fecha_expiracion || !tarea.Fecha_creacion || !tarea.Estado || !tarea.Prioridad) {
    return res.status(400).json({ message: 'Información incompleta' });
  }
  
  const values = [tarea.Titulo, tarea.Descripcion, tarea.Tipo, tarea.Fecha_expiracion, tarea.Fecha_creacion, tarea.Estado, tarea.Prioridad];
  const query = `INSERT INTO tareas (Titulo, Descripcion, Tipo, Fecha_expiracion, Fecha_creacion, Estado, Prioridad) VALUES (?, ?, ?, ?, ?, ?, ?)`;

  dbConexion.query(query, values, (error, result) => {
    if (error) {
      console.error('Error al enviar tarea:', error.message);
      return res.status(500).json({ message: 'Error al enviar tarea' });
    } else {
      return res.json({ message: 'La tarea se ha agregado a la lista de tareas' });
    }
  });
});


// actualizar estado de tarea
app.put('/actualizar/estado/:id',(req,res)=>{
  const id = req.params.id;
  const nuevoEstado = req.body.estado;
  

  if (nuevoEstado !== 'abierta' && nuevoEstado !== 'caducada') {
    return res.status(400).json({ message: 'El nuevo estado no es válido' });
  }
  // Actualizar el estado de la tarea en la base de datos
  const query = 'UPDATE tareas SET Estado = ? WHERE id = ?';
  dbConexion.query(query, [nuevoEstado, id], (error, result) => {
    if (error) {
      console.error('Error al actualizar estado de la tarea:', error.message);
      return res.status(500).json({ message: 'Error al actualizar estado de la tarea' });
    } else if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se encontró la tarea con el ID proporcionado' });
    }
    // Si la actualización fue exitosa, devolver un mensaje de éxito
    res.json({ message: 'Se ha actualizado el estado de la tarea' });
  });


})

// actualizar datos de la tarea en la tabla
app.put('/actualizar/tarea/:id', (req, res) => {
  const id = req.params.id;
  const tareaActualizar = req.body; // Obtener la tarea actualizada del cuerpo de la solicitud
  console.log(tareaActualizar);

  // Realizar la actualización en la base de datos
  const query = 'UPDATE tareas SET Titulo = ?, Descripcion = ?, Tipo = ?, Fecha_expiracion = ?, Fecha_creacion = ?, Estado = ?, Prioridad = ? WHERE id = ?';
  const values = [tareaActualizar.Titulo, tareaActualizar.Descripcion, tareaActualizar.Tipo, tareaActualizar.Fecha_expiracion, tareaActualizar.Fecha_creacion, tareaActualizar.Estado, tareaActualizar.Prioridad, id];

  dbConexion.query(query, values, (error, result) => {
      if (error) {
          console.error('Error al actualizar la tarea:', error.message);
          return res.status(500).json({ message: 'Error al actualizar la tarea' });
      } else if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'No se encontró la tarea para actualizar' });
      }

      res.json({ message: 'Tarea actualizada exitosamente' });
  });
});


// elimina una tarea
app.delete('/eliminar/tarea/:id',(req,res)=>{
  const id = req.params.id;
  const value  =[id];
  
  const query = 'DELETE FROM tareas WHERE id = ?';

  dbConexion.query(query,value,(error,result)=>{
    if(error){
      console.error('Error al eliminar tarea: '+ error.message);
      return res.status(500).json({ message: 'Error al eliminar tarea' });
    }else if(result.affectedRows === 0){
      return res.status(404).json({ message: 'No existe la tarea a eliminar' });
    }

    res.json({ message:'Se ha eliminado la tarea.' });

  })
  
})

// escucha el puerto (tienes que seguir el enlace para correr el programa) 
app.listen(port,()=>{
  console.log(`Listening on: http://localhost:${port}`)
})