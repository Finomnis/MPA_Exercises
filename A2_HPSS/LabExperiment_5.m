%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% LAB EXPERIMENT 5
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

addpath('providedCode');

[x,fs] = audioread('Data/DrumSolo.wav');
[x_h, x_p] = HPSS(x,1024, 512, win('sin',1024), fs, 0.2, 500);
audiowrite('Data_out/DrumSolo_h.wav', x_h, fs);
audiowrite('Data_out/DrumSolo_p.wav', x_p, fs);

[x,fs] = audioread('Data/Stepdad.wav');
[x_h, x_p] = HPSS(x,1024, 512, win('sin',1024), fs, 0.2, 500);
audiowrite('Data_out/Stepdad_h.wav', x_h, fs);
audiowrite('Data_out/Stepdad_p.wav', x_p, fs);

[x,fs] = audioread('Data/Applause.wav');
[x_h, x_p] = HPSS(x,1024, 512, win('sin',1024), fs, 0.2, 500);
audiowrite('Data_out/Applause_h.wav', x_h, fs);
audiowrite('Data_out/Applause_p.wav', x_p, fs);

