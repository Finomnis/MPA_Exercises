clear;
close all;


fs=22050;
a=0;b=1;
para_freq = 400;	%Frequency for chirp singal
t = a:(1/fs)*(b-a):b-(1/(fs*(b-a)));              
f = 0.7*sin(para_freq*pi*t.*t);  
sizeFade = 256;
window = hann(sizeFade*2)';
window = window(sizeFade+1:end);
f(end-sizeFade+1:end) = f(end-sizeFade+1:end).*window;

figure;
h = plot(t,f);       
set(h,'LineWidth',1);
axis([a,b,-1,1])
printPaperPosition = [1   10   16.7  2]; %[left, bottom, width, height]
printFile = 'Sound_Chirp';
set(gcf,'PaperPosition',printPaperPosition); 
print('-dpng',strcat(printFile),'-r600');

wavwrite(f,fs,'Sound_Chirp.wav')