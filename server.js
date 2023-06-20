const express = require('express');

const app = express();


// app.use(express.bodyParser())

app.get('/', (req, res) => {
	
	res.json('root')
})




app.listen(3000, ()=>{
	console.log(`http://localhost:3000/`)
})