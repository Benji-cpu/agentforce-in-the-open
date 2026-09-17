/** Synthetic demo: creates a queued support request, never claims a live transfer. */
public with sharing class NorthavenSupportRequest {
    @TestVisible private static String queueName='Northaven_Support';
    @TestVisible private static String lastError;
    public class Request {
        @InvocableVariable(required=true) public String customerEmail;
        @InvocableVariable(required=true) public String summary;
    }
    public class Result {
        @InvocableVariable public Boolean created;
        @InvocableVariable public String caseNumber;
        @InvocableVariable public String message;
    }
    @InvocableMethod(label='Create Northaven Support Request')
    public static List<Result> createRequests(List<Request> requests) {
        List<Result> results = new List<Result>();
        List<Group> queues = [SELECT Id FROM Group WHERE DeveloperName=:queueName AND Type='Queue' LIMIT 1];
        for (Request req : requests) {
            Result r = new Result(); r.created=false; r.caseNumber='';
            String email = req == null || req.customerEmail == null ? '' : req.customerEmail.trim().toLowerCase();
            String summary = req == null || req.summary == null ? '' : req.summary.trim();
            if (!Pattern.matches('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',email) || summary.length()<5 || summary.length()>2000) {
                r.message='Please provide a valid reply email and a short description of the issue.';
            } else if (queues.isEmpty()) {
                r.message='I could not create a support request because the demo queue is unavailable. No request was submitted.';
            } else {
                // Same email and summary on the same UTC date reuses a request. Unique key also prevents racing duplicates.
                String key=EncodingUtil.convertToHex(Crypto.generateDigest('SHA-256',Blob.valueOf(email+'|'+summary+'|'+DateTime.now().formatGMT('yyyy-MM-dd'))));
                try {
                    List<Case> existing=[SELECT Id,CaseNumber FROM Case WHERE Northaven_Request_Key__c=:key LIMIT 1];
                    Case c;
                    if(existing.isEmpty()) {
                        c=new Case(Subject='Northaven demo: '+summary.left(200),Description='Synthetic Agentforce demonstration.\n\nCustomer context:\n'+summary,
                          SuppliedEmail=email,Origin='Web',Status='New',Priority='Medium',OwnerId=queues[0].Id,Northaven_Request_Key__c=key);
                        insert c;
                        c=[SELECT CaseNumber FROM Case WHERE Id=:c.Id];
                    } else { c=existing[0]; }
                    r.created=true; r.caseNumber=c.CaseNumber;
                    r.message='Support request '+c.CaseNumber+' is saved in the Northaven demo support queue. This is an asynchronous request, not a live chat transfer. No email was sent.';
                } catch(Exception e) {
                    lastError=e.getMessage();
                    r.message='I could not confirm a support request. Please do not assume anyone has received it.';
                }
            }
            results.add(r);
        }
        return results;
    }
}
