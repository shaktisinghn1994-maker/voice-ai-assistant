import { RestaurantOutlet, VoiceOrderDraft } from '../types';

export function buildPetpoojaSaveOrderPayload(
  outlet: RestaurantOutlet,
  draft: VoiceOrderDraft
) {
  const orderId = draft.petpoojaOrderId || `RC-${Date.now().toString().slice(-6)}`;
  const nowDate = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().split(' ')[0];

  return {
    app_key: 'pp_live_ratricall_key_99281a',
    app_secret: 'pp_sec_************************',
    access_token: `tok_${outlet.petpoojaRestId.toLowerCase()}_active`,
    orderinfo: {
      OrderInfo: {
        Restaurant: {
          details: {
            res_name: outlet.name,
            address: `${outlet.area}, ${outlet.city}`,
            contact_information: outlet.virtualDidNumber,
            restID: outlet.petpoojaRestId,
          },
        },
        Customer: {
          details: {
            email: 'voice-order@ratricall.in',
            name: draft.customerName || 'Late Night Caller',
            address: `${draft.deliveryAddress}${draft.landmark ? ` (Landmark: ${draft.landmark})` : ''}`,
            phone: draft.customerPhone.replace(/\s+/g, ''),
            latitude: '12.9716',
            longitude: '77.6412',
          },
        },
        Order: {
          details: {
            orderID: orderId,
            preorder_date: nowDate,
            preorder_time: nowTime,
            service_charge: '0',
            sc_tax_amount: '0',
            delivery_charges: String(draft.deliveryCharge),
            dc_tax_amount: '0',
            dc_gst_details: [],
            packing_charges: String(draft.packagingCharge),
            pc_tax_amount: '0',
            order_type: 'H', // Home Delivery in Petpooja spec
            ondc_bap: 'RATRICALL_VOICE_AI',
            advanced_order: 'N',
            payment_type: draft.paymentMode === 'UPI_LINK' ? 'ONLINE' : 'COD',
            table_no: '',
            no_of_persons: '0',
            discount_total: '0',
            tax_total: String(draft.cgst + draft.sgst),
            discount_type: 'F',
            total: String(draft.grandTotal),
            description: `AI Voice Order (${draft.locationPinStatus === 'repeat_saved' ? 'Repeat Caller Verified' : 'WhatsApp Pin Sent'})`,
            created_on: `${nowDate} ${nowTime}`,
            enable_delivery: 1,
            min_prep_time: 15,
            callback_url: 'https://api.ratricall.in/webhooks/petpooja/order-status',
          },
        },
        OrderItem: {
          details: draft.items.map((item) => ({
            id: item.item_id,
            name: `${item.item_name} (${item.variation_name})`,
            gst_liability: 'vendor',
            item_tax: [
              { id: 'TAX_CGST_2_5', name: 'CGST 2.5%', amount: String((item.total_price * 0.025).toFixed(2)) },
              { id: 'TAX_SGST_2_5', name: 'SGST 2.5%', amount: String((item.total_price * 0.025).toFixed(2)) },
            ],
            item_discount: '0',
            price: String(item.unit_price),
            final_price: String(item.total_price),
            quantity: String(item.quantity),
            description: '',
            variation_name: item.variation_name,
            variation_id: item.variation_id,
            AddonItem: {
              details: item.addons.map((add) => ({
                id: add.addon_id,
                name: add.name,
                group_name: 'Extras',
                price: String(add.price),
                group_id: 1,
                quantity: '1',
              })),
            },
          })),
        },
        Tax: {
          details: [
            {
              id: 'TAX_CGST',
              title: 'CGST',
              type: 'P',
              price: '2.5',
              tax: String(draft.cgst),
              restaurant_liable_amt: String(draft.cgst),
            },
            {
              id: 'TAX_SGST',
              title: 'SGST',
              type: 'P',
              price: '2.5',
              tax: String(draft.sgst),
              restaurant_liable_amt: String(draft.sgst),
            },
          ],
        },
      },
    },
  };
}
