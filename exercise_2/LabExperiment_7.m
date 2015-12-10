clear;
close all;
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% LAB EXPERIMENT 7
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

addpath('providedCode');

[x, fs] = audioread('Data/CastanetsViolin.wav');

N = 1024;
H = N/2;
J = 10;
w = win('sin', N);
lh_sec = 0.2;
lp_Hz = 500;

[x_h, x_p] = HPSS(x,N,H,w,fs,lh_sec,lp_Hz);

novelty = onsetDetection(x, N, H, J);
novelty_p = onsetDetection(x_p, N, H, J);

out = sonify_noveltyCurve(novelty, x, fs, fs/H);
out_p = sonify_noveltyCurve(novelty_p, x_p, fs, fs/H);

p = audioplayer(out, fs);
p_p = audioplayer(out_p, fs);
playblocking(p);
playblocking(p_p);

