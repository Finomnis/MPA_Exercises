%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% LAB EXPERIMENT 5
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

addpath('providedCode');

for f={'Data/CastanetsViolin.wav', 'Data/Stepdad.wav', 'Data/Applause.wav', 'Data/DrumSolo.wav'}
    [x, fs] = audioread(f{1});
    N = 1024;
    H = N/2;
    w = win('sin', N);
    lh_sec = 0.2;
    lp_Hz = 500;

    [x_h, x_p] = HPSS(x,N,H,w,fs,lh_sec,lp_Hz);

    p_h = audioplayer(x_h, fs);
    p_p = audioplayer(x_p, fs);
    playblocking(p_h);
    playblocking(p_p);
end