function [x_h,x_p] = HPSS(x,N,H,w,fs,lh_sec,lp_Hz)
% x:      Input signal
% N:      Frame length
% H:      Hopsize
% w:      Window function of length N
% fs:     Sampling rate of x
% lh_sec: Horizontal median filter length given in seconds
% lp_Hz:  Percussive median filter length given in Hertz

%% stft
x_t = stft(x, N, H, w);

%% power spectrogram
x_p = abs(x_t);

%% median filtering
l_h = ceil((fs./H).*lh_sec);
l_p = ceil((N./fs).*lp_Hz);
x_p_h = medianFilter(x_p, l_h, 'h');
x_p_p = medianFilter(x_p, l_p, 'p');

%% masking
m_h = x_p_h > x_p_p;
m_p = x_p_p >= x_p_h;

visualize_matrix(m_h);
visualize_matrix(m_p);
x_t_h = zeros(size(x_t));
x_t_p = zeros(size(x_t));
x_t_h(m_h) = x_t(m_h);
x_t_p(m_p) = x_t(m_p);

%% istft
x_h = istft(x_t_h, H, w);
x_p = istft(x_t_p, H, w);

end