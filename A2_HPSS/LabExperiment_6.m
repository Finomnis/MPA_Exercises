%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% LAB EXPERIMENT 6
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

addpath('providedCode');
[x,fs]=audioread('Data/CastanetsViolin.wav');

x_chroma = simple_chroma(x, 4410, 2205, fs);
visualize_simpleChroma(x_chroma, 2205, fs);

[x_h, x_p] = HPSS(x,1024, 512, win('sin',1024), fs, 0.2, 500);

x_h_chroma = simple_chroma(x_h, 4410, 2205, fs);
visualize_simpleChroma(x_h_chroma, 2205, fs);