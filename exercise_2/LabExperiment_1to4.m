clear;
%close all;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% LAB EXPERIMENT 1
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

addpath('providedCode');

[x, fs] = audioread('Data/CastanetsViolin.wav');


N = 1024;
H = N/2;

X = stft(x, N, 512, win('sin', N));
Y = abs(X).^2;
visualize_matrix(Y, 10);
title('N = 1024');


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% LAB EXPERIMENT 2
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

Yh = medianFilter(Y, 11, 'h');
Yp = medianFilter(Y, 11, 'p');


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% LAB EXPERIMENT 3
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

M_h = Yh > Y;
M_p = Yh < Yp;

visualize_matrix(M_h);
title('Harmonic Mask');
%visualize_matrix(M_p);
%title('Percussive Mask');

X_h = X.*M_h;
X_p = X.*M_p;
Y_h = abs(X_h).^2;
Y_p = abs(X_p).^2;

%visualize_matrix(Y_h, 10);
%title('Harmonic Masked Y');
%visualize_matrix(Y_p, 10);
%title('Percussive Masked Y');


%visualize_matrix((Yh>1).*Yh, 10);
%title('Harmonic Masked Y by thresholding');
return;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% LAB EXPERIMENT 4
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

p_h = audioplayer(istft(X_h, H, win('sin', N)), fs);
p_p = audioplayer(istft(X_p, H, win('sin', N)), fs);
playblocking(p_h);
playblocking(p_p);