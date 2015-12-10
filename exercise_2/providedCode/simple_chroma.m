function f_chroma = simple_chroma( x, N, H, fs)
%simple_chroma Computes a chroma representation of x
% x:       input signal
% N:       frame length
% H:       hopsize
% fs:      sampling rate


% STFT
w    = win('sin',N);
X    = stft(x,N,H,w);

% power spectrogram
X_pow = abs(X).^2;

% log compression
X_pow_c = log( 1 + 0.5*X_pow );

% init chroma matrix
f_chroma = zeros( 12, size(X_pow_c,2) );

% bins to consider in spectrogram
n = [ 1:N/2-1 ]; 


% assign a pitch to each frequency bin
pitches = round( 12*log2( (fs * n/N) / 440 )) + 69;

% assign a chroma bin to each frequency bin
chromaMapping = mod( pitches, 12 ) ;

for k = 0:11
    f_chroma( k + 1, : ) = sum( X_pow_c(  (chromaMapping == k), :), 1 );
end

f_chroma = normalizeFeature(f_chroma,2, 0.0001);