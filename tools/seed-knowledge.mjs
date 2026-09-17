// Emits an idempotent Apex seed for the fictional articles; run via ./sf apex run.
import {readFileSync,writeFileSync} from 'node:fs';
const policies=JSON.parse(readFileSync('docs/policies/northaven.json','utf8'));
const quote=s=>"'"+s.replaceAll('\\','\\\\').replaceAll("'","\\'")+"'";
let apex='';
for(const p of policies){
 if(p.text.length>1000)throw new Error('Summary too long');
 apex+=`if ([SELECT COUNT() FROM Knowledge__kav WHERE UrlName=${quote(p.slug)} AND PublishStatus='Online'] == 0) {\n`;
 apex+=` Knowledge__kav article=new Knowledge__kav(Title=${quote(p.title)},UrlName=${quote(p.slug)},Language='en_US',Summary=${quote(p.text)}); insert article;\n`;
 apex+=` article=[SELECT KnowledgeArticleId FROM Knowledge__kav WHERE Id=:article.Id]; KbManagement.PublishingService.publishArticle(article.KnowledgeArticleId,true);\n}\n`;
}
writeFileSync('.sf-tmp/seed-knowledge.apex',apex);
