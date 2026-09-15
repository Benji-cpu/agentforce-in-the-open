@IsTest
private class NorthavenOrderLookupTest {

    @TestSetup
    static void makeData() {
        Account a = new Account(Name = 'Test School');
        insert a;
        Contact c = new Contact(FirstName = 'Test', LastName = 'Buyer', Email = 'buyer@example.test', AccountId = a.Id);
        insert c;
        insert new Order(
            AccountId = a.Id, BillToContactId = c.Id, EffectiveDate = Date.today(), Status = 'Draft',
            Order_Reference__c = 'NI-9001', Fulfilment_Status__c = 'Dispatched', Carrier__c = 'DPD',
            Tracking_Number__c = 'DPD-TEST-1', Expected_Delivery__c = Date.today().addDays(2),
            Items_Summary__c = '1 x thing', Calibration_Certificate__c = 'Pending'
        );
    }

    private static NorthavenOrderLookup.Result call(String ref, String email) {
        NorthavenOrderLookup.Request req = new NorthavenOrderLookup.Request();
        req.orderReference = ref;
        req.customerEmail = email;
        return NorthavenOrderLookup.lookUp(new List<NorthavenOrderLookup.Request>{ req })[0];
    }

    @IsTest
    static void findsOrderWhenReferenceAndEmailMatch() {
        NorthavenOrderLookup.Result r = call('ni 9001', 'Buyer@Example.test');
        System.assertEquals(true, r.found);
        System.assertEquals('NI-9001', r.orderReference);
        System.assertEquals('Dispatched', r.fulfilmentStatus);
        System.assertEquals('DPD-TEST-1', r.trackingNumber);
        System.assertEquals('Pending', r.calibrationCertificate);
    }

    @IsTest
    static void refusesWhenEmailDoesNotMatch() {
        NorthavenOrderLookup.Result r = call('NI-9001', 'someone-else@example.test');
        System.assertEquals(false, r.found);
        System.assert(r.message.contains('could not find'), r.message);
        System.assertEquals(null, r.trackingNumber, 'no detail must leak on a mismatch');
    }

    @IsTest
    static void refusesUnknownReference() {
        NorthavenOrderLookup.Result r = call('NI-0000', 'buyer@example.test');
        System.assertEquals(false, r.found);
    }

    @IsTest
    static void asksForMissingInputs() {
        System.assertEquals(false, call('', 'buyer@example.test').found);
        System.assertEquals(false, call('NI-9001', '').found);
        System.assertEquals('', NorthavenOrderLookup.normaliseReference('no digits'));
    }
}
