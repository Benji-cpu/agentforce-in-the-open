@IsTest
private class NorthavenSupportRequestTest {
    @TestSetup static void queue() {
        Group q=new Group(Name='Northaven Support Demo',DeveloperName='Northaven_Test_Queue',Type='Queue');insert q;
        insert new QueueSobject(QueueId=q.Id,SobjectType='Case');
    }
    static NorthavenSupportRequest.Request req(String email,String summary) {
        NorthavenSupportRequest.queueName='Northaven_Test_Queue';
        NorthavenSupportRequest.Request r=new NorthavenSupportRequest.Request();r.customerEmail=email;r.summary=summary;return r;
    }
    @IsTest static void persistsContextInQueueAndReusesRetry() {
        NorthavenSupportRequest.Request request=req('buyer@example.test','NI-2046 late; customer requests a carrier investigation');
        NorthavenSupportRequest.Result r=NorthavenSupportRequest.createRequests(new List<NorthavenSupportRequest.Request>{request})[0];
        System.assertEquals(true,r.created,r.message+' Internal: '+NorthavenSupportRequest.lastError);
        Case c=[SELECT Description,OwnerId,SuppliedEmail FROM Case WHERE CaseNumber=:r.caseNumber];
        System.assert(c.Description.contains('NI-2046 late'));
        System.assertEquals([SELECT Id FROM Group WHERE DeveloperName='Northaven_Test_Queue'].Id,c.OwnerId);
        System.assertEquals('buyer@example.test',c.SuppliedEmail);
        System.assertEquals(r.caseNumber,NorthavenSupportRequest.createRequests(new List<NorthavenSupportRequest.Request>{request})[0].caseNumber);
        System.assertEquals(1,[SELECT COUNT() FROM Case]);
    }
    @IsTest static void rejectsMissingContactWithoutWriting() {
        System.assertEquals(false,NorthavenSupportRequest.createRequests(new List<NorthavenSupportRequest.Request>{req('','Help with my order')})[0].created);
        System.assertEquals(0,[SELECT COUNT() FROM Case]);
    }
    @IsTest static void unavailableQueueNeverClaimsSuccess() {
        NorthavenSupportRequest.Request request=req('buyer@example.test','Help with my order');
        NorthavenSupportRequest.queueName='Northaven_No_Such_Queue';
        NorthavenSupportRequest.Result r=NorthavenSupportRequest.createRequests(new List<NorthavenSupportRequest.Request>{request})[0];
        System.assertEquals(false,r.created);System.assert(r.message.contains('No request was submitted'));
    }
}
