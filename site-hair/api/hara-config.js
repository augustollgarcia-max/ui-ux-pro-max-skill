// Public capability flag; no credentials or visitor data are returned.
const {relayConfig}=require('./hara-lead');
module.exports=(req,res)=>{res.setHeader('Cache-Control','no-store');if(req.method!=='GET')return res.status(405).json({error:'Método não permitido'});return res.status(200).json({leadsEnabled:!!relayConfig(process.env)});};
