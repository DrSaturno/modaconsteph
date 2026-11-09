import json, datetime, sys

ACC, CON = "0000000000", "0000000000"
BASE = f"accounts/{ACC}/containers/{CON}"
GA4, PIXEL = "G-8FPSLDRG5B", "421894017597792"

def tpl(k, v): return {"type": "TEMPLATE", "key": k, "value": v}
def boo(k, v): return {"type": "BOOLEAN", "key": k, "value": "true" if v else "false"}

variables = []
def var(vid, name, tipo, params):
    variables.append({"accountId": ACC, "containerId": CON, "variableId": str(vid), "name": name, "type": tipo,
                      "parameter": params, "fingerprint": str(1700000000000 + vid),
                      "formatValue": {}})
var(20, "Const - GA4 ID", "c", [tpl("value", GA4)])
var(21, "Const - Meta Pixel ID", "c", [tpl("value", PIXEL)])
def dlv(vid, name, key):
    var(vid, name, "v", [{"type": "INTEGER", "key": "dataLayerVersion", "value": "2"}, boo("setDefaultValue", False), tpl("name", key)])
dlv(22, "DLV - ecommerce", "ecommerce")
dlv(23, "DLV - lead_type", "lead_type")
dlv(24, "DLV - curso", "curso")
dlv(25, "DLV - payment_type", "payment_type")
dlv(26, "DLV - reserva_id", "reserva_id")
dlv(27, "DLV - ubicacion", "ubicacion")

triggers = []
def trig(tid, name, tipo, extra=None):
    t = {"accountId": ACC, "containerId": CON, "triggerId": str(tid), "name": name, "type": tipo, "fingerprint": str(1700000000000 + tid)}
    if extra: t.update(extra)
    triggers.append(t)
trig(10, "MCS - Todas las páginas", "PAGEVIEW")
FUNNEL = "^(view_item|begin_checkout|add_payment_info|generate_lead|reserva_creada|click_whatsapp|click_instagram)$"
trig(11, "MCS - Eventos del embudo", "CUSTOM_EVENT", {"customEventFilter": [{"type": "MATCH_REGEX", "parameter": [tpl("arg0", "{{_event}}"), tpl("arg1", FUNNEL)]}]})
trig(12, "MCS - Cambio de página (sin recargar)", "CUSTOM_EVENT", {"customEventFilter": [{"type": "EQUALS", "parameter": [tpl("arg0", "{{_event}}"), tpl("arg1", "mcs_route_change")]}]})

tags = []
def tag(tid, name, tipo, params, firing, notes=""):
    t = {"accountId": ACC, "containerId": CON, "tagId": str(tid), "name": name, "type": tipo, "parameter": params,
         "fingerprint": str(1700000000000 + tid), "firingTriggerId": [str(x) for x in firing],
         "tagFiringOption": "ONCE_PER_EVENT", "monitoringMetadata": {"type": "MAP"}, "consentSettings": {"consentStatus": "NOT_SET"}}
    if notes: t["notes"] = notes
    tags.append(t)

# 1) Google Analytics 4: la etiqueta de Google (carga Analytics y manda page_view)
tag(1, "GA4 - Google tag", "googtag", [tpl("tagId", "{{Const - GA4 ID}}")], [10],
    "Carga Google Analytics 4 y manda las vistas de página. Propiedad G-8FPSLDRG5B (la misma de la web anterior).")

# 2) GA4: eventos del embudo (todos con una sola etiqueta: el nombre del evento es el mismo de la web)
def fila(p, v): return {"type": "MAP", "map": [tpl("parameter", p), tpl("parameterValue", v)]}
tag(2, "GA4 - Eventos del embudo", "gaawe", [
    boo("sendEcommerceData", True), tpl("getEcommerceDataFrom", "dataLayer"),
    tpl("eventName", "{{_event}}"), tpl("measurementIdOverride", "{{Const - GA4 ID}}"),
    {"type": "LIST", "key": "eventSettingsTable", "list": [
        fila("lead_type", "{{DLV - lead_type}}"), fila("curso", "{{DLV - curso}}"),
        fila("payment_type", "{{DLV - payment_type}}"), fila("reserva_id", "{{DLV - reserva_id}}"),
        fila("ubicacion", "{{DLV - ubicacion}}")]},
], [11], "view_item, begin_checkout, add_payment_info, generate_lead, reserva_creada, click_whatsapp y click_instagram. La compra (purchase) la manda el servidor.")

BASE_PIXEL = """<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '{{Const - Meta Pixel ID}}');
fbq('track', 'PageView');
</script>"""
tag(3, "Meta Pixel - Base + PageView", "html", [tpl("html", BASE_PIXEL), boo("supportDocumentWrite", False)], [10],
    "Pixel 421894017597792 (el mismo de la web anterior). Carga el Pixel y cuenta la primera página.")

tag(4, "Meta Pixel - PageView (cambio de página)", "html", [tpl("html", "<script>if (window.fbq) { fbq('track', 'PageView'); }</script>"), boo("supportDocumentWrite", False)], [12],
    "La web no recarga al cambiar de página: este aviso cuenta cada página que mira la alumna después de la primera.")

EVENTOS_PIXEL = """<script>
(function () {
  if (typeof fbq !== 'function') { return; }
  var evento = {{Event}};
  var lead = {{DLV - lead_type}};
  var ubic = {{DLV - ubicacion}};
  var ec = {{DLV - ecommerce}} || {};
  var item = (ec.items && ec.items[0]) || {};
  // evento de la web -> evento estándar de Meta (se cambia acá, sin tocar el código de la web)
  var MAPA = {
    view_item: 'ViewContent',
    begin_checkout: 'InitiateCheckout',
    add_payment_info: 'AddPaymentInfo',
    reserva_creada: 'Schedule',
    click_whatsapp: 'Contact',
    generate_lead: (lead === 'boletin' ? 'Subscribe' : 'Lead')
  };
  var nombre = MAPA[evento];
  if (!nombre) { return; }
  var datos = {};
  if (ec.value != null) { datos.value = ec.value; datos.currency = ec.currency || 'ARS'; }
  if (item.item_id) { datos.content_ids = [item.item_id]; datos.content_type = 'product'; datos.content_name = item.item_name; }
  if (lead) { datos.content_category = lead; } else if (ubic) { datos.content_category = ubic; }
  fbq('track', nombre, datos);
})();
</script>"""
tag(5, "Meta Pixel - Eventos del embudo", "html", [tpl("html", EVENTOS_PIXEL), boo("supportDocumentWrite", False)], [11],
    "ViewContent, InitiateCheckout, AddPaymentInfo, Schedule, Lead, Subscribe y Contact (clic a WhatsApp). Purchase lo manda el servidor (API de Conversiones). Los clics a Instagram van solo a Analytics.")

builtin = [{"accountId": ACC, "containerId": CON, "type": t, "name": n} for t, n in
           [("EVENT", "Event"), ("PAGE_URL", "Page URL"), ("PAGE_HOSTNAME", "Page Hostname"), ("PAGE_PATH", "Page Path"), ("REFERRER", "Referrer")]]

doc = {
  "exportFormatVersion": 2,
  "exportTime": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
  "containerVersion": {
    "path": f"{BASE}/versions/0", "accountId": ACC, "containerId": CON, "containerVersionId": "0",
    "container": {"path": BASE, "accountId": ACC, "containerId": CON, "name": "www.modaconsteph.com", "publicId": "GTM-KC6FGSH8",
                  "usageContext": ["WEB"], "fingerprint": "1700000000000",
                  "tagManagerUrl": f"https://tagmanager.google.com/#/container/{BASE}/workspaces?apiLink=container"},
    "tag": tags, "trigger": triggers, "variable": variables, "builtInVariable": builtin,
    "fingerprint": "1700000000000",
    "tagManagerUrl": f"https://tagmanager.google.com/#/versions/{BASE}/versions/0?apiLink=version",
  },
}
out = sys.argv[1]
json.dump(doc, open(out, "w", encoding="utf8"), ensure_ascii=False, indent=2)
print("ok", out, len(tags), "tags", len(triggers), "triggers", len(variables), "variables")
