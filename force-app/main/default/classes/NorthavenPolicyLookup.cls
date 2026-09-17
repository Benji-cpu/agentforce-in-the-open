/** Exact retrieval from three published, synthetic Salesforce Knowledge articles. Not vector search. */
public with sharing class NorthavenPolicyLookup {
    @TestVisible private static String slugPrefix='northaven-';
    public class Request { @InvocableVariable(required=true) public String topic; }
    public class Result {
        @InvocableVariable public Boolean found;
        @InvocableVariable public String title;
        @InvocableVariable public String policyText;
        @InvocableVariable public String articleId;
    }
    @InvocableMethod(label='Read Northaven Policy')
    public static List<Result> readPolicy(List<Request> requests) {
        Map<String,String> slugs=new Map<String,String>{'returns'=>slugPrefix+'returns','calibration'=>slugPrefix+'calibration','delivery'=>slugPrefix+'delivery'};
        Map<String,Knowledge__kav> articles=new Map<String,Knowledge__kav>();
        for(Knowledge__kav a:[SELECT Title,Summary,UrlName,KnowledgeArticleId FROM Knowledge__kav WHERE PublishStatus='Online' AND Language='en_US' AND UrlName LIKE 'northaven-%']) articles.put(a.UrlName,a);
        List<Result> results=new List<Result>();
        for(Request req:requests){
            Result r=new Result();r.found=false;r.policyText='No published policy was found. Do not guess; offer a support request.';
            String slug=req==null||req.topic==null?null:slugs.get(req.topic.trim().toLowerCase());
            if(articles.containsKey(slug)) {Knowledge__kav a=articles.get(slug);r.found=true;r.title=a.Title;r.policyText=a.Summary;r.articleId=a.KnowledgeArticleId;}
            results.add(r);
        }
        return results;
    }
}
