@IsTest
private class NorthavenPolicyLookupTest {
    @IsTest static void missingOrUnknownPolicyIsExplicit() {
        NorthavenPolicyLookup.Request r=new NorthavenPolicyLookup.Request();r.topic='unrecognised';
        NorthavenPolicyLookup.Result result=NorthavenPolicyLookup.readPolicy(new List<NorthavenPolicyLookup.Request>{r})[0];
        System.assertEquals(false,result.found);System.assertEquals(null,result.articleId);
        System.assert(result.policyText.contains('Do not guess'));
    }
    @IsTest static void readsPublishedArticleNotDraft() {
        NorthavenPolicyLookup.slugPrefix='northaven-test-policy-';
        Knowledge__kav a=new Knowledge__kav(Title='Synthetic returns policy',UrlName='northaven-test-policy-returns',Language='en_US',Summary='Returns within 30 days.');insert a;
        NorthavenPolicyLookup.Request r=new NorthavenPolicyLookup.Request();r.topic='returns';
        System.assertEquals(false,NorthavenPolicyLookup.readPolicy(new List<NorthavenPolicyLookup.Request>{r})[0].found);
        a=[SELECT KnowledgeArticleId FROM Knowledge__kav WHERE Id=:a.Id];
        KbManagement.PublishingService.publishArticle(a.KnowledgeArticleId,true);
        NorthavenPolicyLookup.Result result=NorthavenPolicyLookup.readPolicy(new List<NorthavenPolicyLookup.Request>{r})[0];
        System.assertEquals(true,result.found);System.assertEquals('Returns within 30 days.',result.policyText);
        System.assertEquals(a.KnowledgeArticleId,result.articleId);
    }
}
