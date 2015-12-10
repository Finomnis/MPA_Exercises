clear;
close all;
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% LAB EXPERIMENT 6
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

addpath('providedCode');

[x, fs] = audioread('Data/CastanetsViolin.wav');
N = 4410;
H = N/2;
w = win('sin', N);
lh_sec = 0.2;
lp_Hz = 500;

[x_h, x_p] = HPSS(x,N,H,w,fs,lh_sec,lp_Hz);

f_chroma = simple_chroma(x, N, H, fs);
f_h_chroma = simple_chroma(x_h, N, H, fs);

visualize_simpleChroma(f_chroma, H, fs);
title('Chroma');
visualize_simpleChroma(f_h_chroma, H, fs);
title('Chroma - HPSSd');
