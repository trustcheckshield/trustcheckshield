/* Trust Check Shield - consent and 18+ confirmation.
   Shows the bottom banner until the visitor confirms they are 18 or older and accepts the Privacy Policy and Terms.
   Exposes window.TCSConsent { ok(), open(), withdraw() } and fires a "tcs-consent" event when consent is given. */
(function(){
"use strict";
var KEY="tcs_consent",VERSION=1;
function $(id){return document.getElementById(id)}
function read(){
  try{var v=JSON.parse(localStorage.getItem(KEY)||"null");
    return v&&v.v===VERSION&&v.accepted===true&&v.age18===true?v:null}catch(e){return null}}
function ok(){return !!read()}
function say(t){var m=$("consentMsg");if(!m)return;m.textContent=t||"";m.hidden=!t}
function show(){
  var b=$("consentBanner");if(!b)return;
  var rec=read();
  $("consentAge").checked=!!rec;$("consentAge").disabled=!!rec;
  $("consentAccept").hidden=!!rec;$("consentDecline").hidden=!!rec;$("consentWithdraw").hidden=!rec;$("consentClose").hidden=!rec;
  $("consentAccept").disabled=!$("consentAge").checked;
  say(rec?"You accepted on "+new Date(rec.t).toLocaleDateString([],{day:"numeric",month:"short",year:"numeric"})+". You can withdraw your consent below.":"");
  b.hidden=false}
function hide(){var b=$("consentBanner");if(b)b.hidden=true}
function accept(){
  if(!$("consentAge").checked){say("Please tick the box to confirm you are 18 or older.");return}
  try{localStorage.setItem(KEY,JSON.stringify({v:VERSION,accepted:true,age18:true,t:Date.now()}))}
  catch(e){say("Your browser is blocking saved data, so your choice cannot be remembered. Please allow site data and try again.");return}
  hide();
  try{window.dispatchEvent(new Event("tcs-consent"))}catch(e){}}
function decline(){
  say("No problem. Scans on your device still work, but sign-in, community checks and reporting stay off. You can change your mind any time from Privacy choices at the bottom of the page.");
  $("consentAccept").hidden=true;$("consentDecline").hidden=true;$("consentClose").hidden=false}
function withdraw(){
  try{localStorage.removeItem(KEY)}catch(e){}
  $("consentAge").disabled=false;$("consentAge").checked=false;
  say("Consent withdrawn. Sign-in, community checks and reporting are switched off again.");
  $("consentAccept").hidden=false;$("consentDecline").hidden=false;$("consentWithdraw").hidden=true;$("consentAccept").disabled=true;$("consentClose").hidden=false}
function init(){
  if(!$("consentBanner"))return;
  $("consentAge").addEventListener("change",function(){$("consentAccept").disabled=!$("consentAge").checked;if($("consentAge").checked)say("")});
  $("consentAccept").addEventListener("click",accept);
  $("consentDecline").addEventListener("click",decline);
  $("consentWithdraw").addEventListener("click",withdraw);
  $("consentClose").addEventListener("click",hide);
  var link=$("privacyChoices");if(link)link.addEventListener("click",function(e){e.preventDefault();show()});
  if(!ok())show()}
window.TCSConsent={ok:ok,open:show,withdraw:withdraw};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
