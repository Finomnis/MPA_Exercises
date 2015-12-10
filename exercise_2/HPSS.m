function [x_h,x_p] = HPSS(x,N,H,w,fs,lh_sec,lp_Hz)
% x:      Input signal
% N:      Frame length
% H:      Hopsize
% w:      Window function of length N
% fs:     Sampling rate of x
% lh_sec: Horizontal median filter length given in seconds
% lp_Hz:  Percussive median filter length given in Hertz

%% stft
X = stft(x, N, 512, w);

%% power spectrogram
Y = abs(X).^2;

%% median filtering
lh_idx = ceil(fs/H*lh_sec);
lp_idx = ceil(N/fs*lp_Hz);
Yh = medianFilter(Y, lh_idx, 'h');
Yp = medianFilter(Y, lp_idx, 'p');

%% masking
X_h = X.*(Yh > Yp);
X_p = X.*(Yh < Yp);

%% istft
x_h = istft(X_h, H, win('sin', N));
x_p = istft(X_p, H, win('sin', N));
end