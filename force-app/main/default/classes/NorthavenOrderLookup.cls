/**
 * The one real action behind the Northaven Support agent: look an order up by the
 * reference on the customer's confirmation email, and only hand its details back if
 * the email address they give matches the contact the order was billed to.
 *
 * Northaven Instruments is a fictional company; every order this reads is synthetic.
 *
 * Shape matters more than logic here. Agent Script binds action inputs and outputs to
 * the @InvocableVariable field names character for character, so these names are the
 * contract with Northaven_Support.agent — rename one side and the publish fails.
 */
public with sharing class NorthavenOrderLookup {

    public class Request {
        @InvocableVariable(label='Order Reference' description='The order reference from the confirmation email, e.g. NI-2041. Case and spacing do not matter.' required=true)
        public String orderReference;

        @InvocableVariable(label='Customer Email' description='The email address the order was placed under. Must match the order before any detail is returned.' required=true)
        public String customerEmail;
    }

    public class Result {
        @InvocableVariable(label='Found' description='True when an order with that reference exists AND the email matches it.')
        public Boolean found;

        @InvocableVariable(label='Order Reference' description='The canonical order reference, e.g. NI-2041.')
        public String orderReference;

        @InvocableVariable(label='Fulfilment Status' description='One of: Processing, Awaiting stock, Dispatched, Delivered, Cancelled.')
        public String fulfilmentStatus;

        @InvocableVariable(label='Carrier' description='Who is carrying the parcel, once dispatched. Empty before then.')
        public String carrier;

        @InvocableVariable(label='Tracking Number' description='The carrier tracking number, once dispatched. Empty before then.')
        public String trackingNumber;

        @InvocableVariable(label='Expected Delivery' description='Expected delivery date as text, e.g. 18 September 2026. Empty if not yet known.')
        public String expectedDelivery;

        @InvocableVariable(label='Items Summary' description='What is on the order, in one line.')
        public String itemsSummary;

        @InvocableVariable(label='Calibration Certificate' description='Not applicable, Pending, or Issued.')
        public String calibrationCertificate;

        @InvocableVariable(label='Order Date' description='The date the order was placed, as text.')
        public String orderDate;

        @InvocableVariable(label='Message' description='Plain-English explanation when found is false. Safe to read out to the customer.')
        public String message;
    }

    @InvocableMethod(label='Look Up Northaven Order' description='Finds an order by its reference and verifies it against the customer email before returning status, carrier, tracking and delivery details.')
    public static List<Result> lookUp(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            results.add(lookUpOne(req));
        }
        return results;
    }

    private static Result lookUpOne(Request req) {
        Result r = new Result();
        r.found = false;

        String ref = normaliseReference(req.orderReference);
        String email = req.customerEmail == null ? '' : req.customerEmail.trim().toLowerCase();

        if (String.isBlank(ref)) {
            r.message = 'I need the order reference from your confirmation email. It looks like NI- followed by four digits.';
            return r;
        }
        if (String.isBlank(email) || !email.contains('@')) {
            r.message = 'I need the email address the order was placed under so I can check it is your order.';
            return r;
        }

        List<Order> orders = [
            SELECT Id, Order_Reference__c, Fulfilment_Status__c, Carrier__c, Tracking_Number__c,
                   Expected_Delivery__c, Items_Summary__c, Calibration_Certificate__c, EffectiveDate,
                   BillToContact.Email
            FROM Order
            WHERE Order_Reference__c = :ref
            LIMIT 1
        ];

        if (orders.isEmpty()) {
            r.message = 'I could not find an order with the reference ' + ref + ' under that email address. Please check both against your confirmation email.';
            return r;
        }

        Order o = orders[0];
        String billedEmail = o.BillToContact == null || o.BillToContact.Email == null ? '' : o.BillToContact.Email.toLowerCase();
        if (billedEmail != email) {
            // Deliberately the same wording as "not found": do not confirm that a reference exists
            // to someone who cannot match the email on it.
            r.message = 'I could not find an order with the reference ' + ref + ' under that email address. Please check both against your confirmation email.';
            return r;
        }

        r.found = true;
        r.orderReference = o.Order_Reference__c;
        r.fulfilmentStatus = o.Fulfilment_Status__c;
        r.carrier = blankToEmpty(o.Carrier__c);
        r.trackingNumber = blankToEmpty(o.Tracking_Number__c);
        r.expectedDelivery = o.Expected_Delivery__c == null ? '' : o.Expected_Delivery__c.format();
        r.itemsSummary = blankToEmpty(o.Items_Summary__c);
        r.calibrationCertificate = o.Calibration_Certificate__c == null ? 'Not applicable' : o.Calibration_Certificate__c;
        r.orderDate = o.EffectiveDate == null ? '' : o.EffectiveDate.format();
        r.message = '';
        return r;
    }

    /** "ni 2041", "NI2041", "#NI-2041" and "2041" all become "NI-2041". */
    @TestVisible
    private static String normaliseReference(String raw) {
        if (raw == null) return '';
        String digits = raw.replaceAll('[^0-9]', '');
        if (digits.length() == 0) return '';
        return 'NI-' + digits;
    }

    private static String blankToEmpty(String s) {
        return String.isBlank(s) ? '' : s;
    }
}
