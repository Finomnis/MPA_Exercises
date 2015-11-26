%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% LAB EXPERIMENT 7
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

addpath('providedCode');

[x, fs] = audioread('Data/StillPluto_BitterPill.wav');

novelty = onsetDetection(x, 882, 441, 10);

result = sonify_noveltyCurve(novelty, x, fs, fs/441);


[x_h, x_p] = HPSS(x,1024, 512, win('sin',1024), fs, 0.2, 500);

novelty_perc = onsetDetection(x_p, 882, 441, 10);

result_perc = sonify_noveltyCurve(novelty_perc, x, fs, fs/441);


playblocking(audioplayer(result, fs));
playblocking(audioplayer(result_perc, fs));
