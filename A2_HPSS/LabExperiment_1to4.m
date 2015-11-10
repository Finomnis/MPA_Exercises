%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% LAB EXPERIMENT 1
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

addpath('providedCode');

[x,fs]=audioread('Data/CastanetsViolin.wav');

x_t = stft(x, 1024, 512, win('sin', 1024));
visualize_matrix(x_t, 10);

% window narrower
% => better time resolution
%   => better representation of the percussive(vertical) part,
%      as percussive signals are time-precise over a large frequency band
% => worse frequency resolution
%   => harmonic part gets blurred, as harmonic signals are
%      frequency-precise over a large time frame
x_t2 = stft(x, 128, 64, win('sin', 128));
visualize_matrix(x_t2, 10);

% opposite of everything written above
x_t2 = stft(x, 8192, 4096, win('sin', 8192));
visualize_matrix(x_t2, 10);

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% LAB EXPERIMENT 2
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%


% filter length 3
%x_t_h = medianFilter(x_t, 3, 'h');
%x_t_p = medianFilter(x_t, 3, 'p');
%visualize_matrix(x_t_h, 10);
%visualize_matrix(x_t_p, 10);

% filter length 11
%x_t_h = medianFilter(x_t, 11, 'h');
%x_t_p = medianFilter(x_t, 11, 'p');
%visualize_matrix(x_t_h, 10);
%visualize_matrix(x_t_p, 10);

% filter length 51
%x_t_h = medianFilter(x_t, 51, 'h');
%x_t_p = medianFilter(x_t, 51, 'p');
%visualize_matrix(x_t_h, 10);
%visualize_matrix(x_t_p, 10);

% filter length 101
%x_t_h = medianFilter(x_t, 101, 'h');
%x_t_p = medianFilter(x_t, 101, 'p');
%visualize_matrix(x_t_h, 10);
%visualize_matrix(x_t_p, 10);


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% LAB EXPERIMENT 3
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% filter length 11
x_t_h = medianFilter(abs(x_t), 11, 'h');
x_t_p = medianFilter(abs(x_t), 11, 'p');

m_h = x_t_h > x_t_p;
m_p = x_t_p > x_t_h;
visualize_matrix(m_h);
visualize_matrix(m_p);

x_t_hf = zeros(size(x_t));
x_t_pf = zeros(size(x_t));
x_t_hf(m_h) = x_t(m_h);
x_t_pf(m_p) = x_t(m_p);
visualize_matrix(x_t_hf, 10);
visualize_matrix(x_t_pf, 10);


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% LAB EXPERIMENT 4
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

x_hf = istft(x_t_hf, 512, win('sin', 1024));
x_pf = istft(x_t_pf, 512, win('sin', 1024));

audiowrite('harmonicComponent.wav', x_hf, fs);
audiowrite('percussiveComponent.wav', x_pf, fs);
