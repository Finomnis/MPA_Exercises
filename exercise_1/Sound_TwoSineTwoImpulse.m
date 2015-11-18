clear;
close all;

fs=22050;
a=0;b=1;t = a:(1/fs)*(b-a):b-(1/(fs*(b-a))); 
f = 0.25*sin(400*2*pi*t)+0.25*sin(450*2*pi*t); 
t1 = round(4.5*fs/10);
t2 = round(5*fs/10);
f(t1)=10;
f(t2)=10;	  

figure;
h = plot(t,f);       
set(h,'LineWidth',1);
axis([a,b,-2.1,5.1])
printPaperPosition = [1   10   16.7  2]; %[left, bottom, width, height]
printFile = 'Sound_TwoSineTwoImpulse';
set(gcf,'PaperPosition',printPaperPosition); 
print('-dpng',strcat(printFile),'-r600');

audiowrite('Sound_TwoSineTwoImpulse.wav', f, fs)