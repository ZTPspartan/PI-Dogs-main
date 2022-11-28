const { Router } = require('express');
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const axios = require ('axios');
const {Dog, Temper}=require('../db')
const {API_KEY} = process.env;

const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);
const getApiInfo = async()=>{
    const apiUrl = await axios.get(`https://api.thedogapi.com/v1/breeds?api_key=${API_KEY}`)
    const apiInfo = await apiUrl.data.map(data =>{
        return {
            id: data.id,
            name: data.name,
            height: data.height,
            weight: data.weight,
            life_span: data.life_span,
            temper: data.temperament,
            image: data.image.url,
        };
    });
    return apiInfo;
}

const getDbInfo = async()=>{
    return await Dog.findAll({
        include:{
            model: Temper,
            attributes:["name"],
            througth:{
                attributes:[],
            },
        }
    });
};

getAllDogs = async()=>{
    const apiInfo=await getApiInfo();
    const dbInfo = await getDbInfo();
    const infoTotal= apiInfo.concat(dbInfo);
    return infoTotal;
}

router.get('/dogs',async(req,res)=>{
    const name = req.query.name;
    let dogsTotal = await getAllDogs();
    if(name){
        let dogName = await dogsTotal.filter(data=> data.name.toLowerCase().includes(name.toLowerCase()));
        dogName.length?
        res.status(200).send(dogName):
        res.status(404).send('Sorry Dog not Found :C')
    }else{
        res.status(200).send(dogsTotal)
    }
})

router.get('/temperaments',async(req,res)=>{
    const temperamentsApi = await axios.get(`https://api.thedogapi.com/v1/breeds?api_key=${API_KEY}`);
    const temperamentFilter=temperamentsApi.data.map(data => data.temperament);
    let tempEach = [];
    temperamentFilter.forEach(element => {
        if(element){
            tempEach = tempEach.concat(element.split(',').join("").split(' '));
        }
    });
    let newTemp = new Set (tempEach);
    newTemp = Array.from(newTemp);

    newTemp.forEach(data =>{
        Temper.findOrCreate({
            where: {name : data}
        })
    })
    const allTemper= await Temper.findAll();
    res.send(allTemper);
})

router.get('/dogs/:id', async (req,res)=>{
    const id=req.params.id;
    const dogsTotal=await getAllDogs()
    if (id) {
        let dogId= dogsTotal.filter(a=>a.id==id)
        dogId.length?
        res.status(200).json(dogId):
        res.status(404).send('no found Dog')
    }
})


router.post('/dogs',async(req,res)=>{
    let{
        name,
        height,
        weight,
        life_span,
        temperament,
        image,
        createinDb,
    } = req.body
    
    if(!image){
        image= await (await axios.get('https://dog.ceo/api/breeds/image/random')).data.message;
    }

    let createDog = await Dog.create({
        name,
        height,
        weight,
        life_span,
        image,
        createinDb,
    });
    
    let findTemp = await Temper.findAll({where: { name: temperament }});
    createDog.addTemper(findTemp);
    res.send("Dog created 100%")
})

module.exports = router;
