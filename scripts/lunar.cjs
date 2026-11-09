/**
 * Đổi ngày dương sang âm lịch Việt Nam (múi giờ +7) để ghi vào `lunar` trong wedding.config.js.
 *   npm run lunar -- 2027-01-16 2026-12-13
 * Thuật toán của Hồ Ngọc Đức (đã thử: 31/10/2026 → 22/9 Bính Ngọ, Tết 2026 = 17/02, Tết 2027 = 06/02).
 */
const PI=Math.PI, INT=Math.floor;
function jdFromDate(dd,mm,yy){const a=INT((14-mm)/12),y=yy+4800-a,m=mm+12*a-3;let jd=dd+INT((153*m+2)/5)+365*y+INT(y/4)-INT(y/100)+INT(y/400)-32045;if(jd<2299161)jd=dd+INT((153*m+2)/5)+365*y+INT(y/4)-32083;return jd;}
function newMoon(k){const T=k/1236.85,T2=T*T,T3=T2*T,dr=PI/180;let Jd1=2415020.75933+29.53058868*k+0.0001178*T2-0.000000155*T3;Jd1+=0.00033*Math.sin((166.56+132.87*T-0.009173*T2)*dr);const M=359.2242+29.10535608*k-0.0000333*T2-0.00000347*T3,Mpr=306.0253+385.81691806*k+0.0107306*T2+0.00001236*T3,F=21.2964+390.67050646*k-0.0016528*T2-0.00000239*T3;let C1=(0.1734-0.000393*T)*Math.sin(M*dr)+0.0021*Math.sin(2*dr*M)-0.4068*Math.sin(Mpr*dr)+0.0161*Math.sin(dr*2*Mpr)-0.0004*Math.sin(dr*3*Mpr)+0.0104*Math.sin(dr*2*F)-0.0051*Math.sin(dr*(M+Mpr))-0.0074*Math.sin(dr*(M-Mpr))+0.0004*Math.sin(dr*(2*F+M))-0.0004*Math.sin(dr*(2*F-M))-0.0006*Math.sin(dr*(2*F+Mpr))+0.0010*Math.sin(dr*(2*F-Mpr))+0.0005*Math.sin(dr*(2*Mpr+M));const deltat=T<-11?0.001+0.000839*T+0.0002261*T2-0.00000845*T3-0.000000081*T*T3:-0.000278+0.000265*T+0.000262*T2;return Jd1+C1-deltat;}
function sunLong(jdn){const T=(jdn-2451545.0)/36525,T2=T*T,dr=PI/180,M=357.52910+35999.05030*T-0.0001559*T2-0.00000048*T*T2,L0=280.46645+36000.76983*T+0.0003032*T2;let DL=(1.914600-0.004817*T-0.000014*T2)*Math.sin(dr*M)+(0.019993-0.000101*T)*Math.sin(dr*2*M)+0.000290*Math.sin(dr*3*M);let L=(L0+DL)*dr;L=L-PI*2*INT(L/(PI*2));return L;}
const tz=7;
const getNewMoonDay=k=>INT(newMoon(k)+0.5+tz/24);
const getSunLongitude=d=>INT(sunLong(d-0.5-tz/24)/PI*6);
function getLunarMonth11(yy){const off=jdFromDate(31,12,yy)-2415021,k=INT(off/29.530588853);let nm=getNewMoonDay(k);if(getSunLongitude(nm)>=9)nm=getNewMoonDay(k-1);return nm;}
function getLeapMonthOffset(a11){const k=INT((a11-2415021.076998695)/29.530588853+0.5);let last,i=1,arc=getSunLongitude(getNewMoonDay(k+i));do{last=arc;i++;arc=getSunLongitude(getNewMoonDay(k+i));}while(arc!=last&&i<14);return i-1;}
function solar2lunar(dd,mm,yy){const dayNumber=jdFromDate(dd,mm,yy),k=INT((dayNumber-2415021.076998695)/29.530588853);let monthStart=getNewMoonDay(k+1);if(monthStart>dayNumber)monthStart=getNewMoonDay(k);let a11=getLunarMonth11(yy),b11=a11,lunarYear;if(a11>=monthStart){lunarYear=yy;a11=getLunarMonth11(yy-1);}else{lunarYear=yy+1;b11=getLunarMonth11(yy+1);}const lunarDay=dayNumber-monthStart+1,diff=INT((monthStart-a11)/29);let lunarLeap=0,lunarMonth=diff+11;if(b11-a11>365){const leapMonthDiff=getLeapMonthOffset(a11);if(diff>=leapMonthDiff){lunarMonth=diff+10;if(diff==leapMonthDiff)lunarLeap=1;}}if(lunarMonth>12)lunarMonth-=12;if(lunarMonth>=11&&diff<4)lunarYear-=1;return [lunarDay,lunarMonth,lunarYear,lunarLeap];}
const CAN=['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'],CHI=['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
const yearName=y=>CAN[(y+6)%10]+' '+CHI[(y+8)%12];
if(process.argv.length<3)console.log("Cách dùng: npm run lunar -- YYYY-MM-DD [YYYY-MM-DD ...]");
for(const d of process.argv.slice(2)){const [y,m,dd]=d.split('-').map(Number);const [ld,lm,ly,leap]=solar2lunar(dd,m,y);const monthName=lm===11?'tháng 11':lm===12?'tháng Chạp':'tháng '+lm;console.log(d,'→',`${ld}/${lm}${leap?' (nhuận)':''} năm ${yearName(ly)}`, '|', `Nhằm ngày ${String(ld).padStart(2,'0')} tháng ${String(lm).padStart(2,'0')}${leap?' nhuận':''} năm ${yearName(ly)}`);}
