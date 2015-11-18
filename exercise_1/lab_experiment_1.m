clear;
close all;

[x, Fs] = audioread('Sound_TwoSineTwoImpulse.wav');
[samples, channels] = size(x);
if(channels > 1)
    x = (x(:,1)+x(:,2))/2;
end
N = 1024;
H = N/2;
w = hann(N);

%plot(w)
%title('Window function')

chi = spectrogram(x, w, N-H);
Y = abs(chi).^2;
Y_decibel = 18.*(log10(Y));

[m, k] = size(chi);
T_coeff = (0:k).*(H/Fs)+(H/Fs);
F_coeff = (0:m).*(Fs/N);

figure
plot(Y)
title('Spectrogram STFT')
xlabel('Frequency indices')
ylabel('Magnitude')
axis([0 m 0 100])

figure
image(Y)
title('Spectrogram STFT')
xlabel('Time Indices')
ylabel('Frequency Indices')
colorbar
axis xy

figure
imagesc(Y)
title('Spectrogram STFT - Scaled')
xlabel('Time Indices')
ylabel('Frequency Indices')
colorbar
axis xy


figure
image(T_coeff, F_coeff, Y)
title('Spectrogram STFT - Time, Frequency indexed')
xlabel('Time in s')
ylabel('Frequency in Hz')
colorbar
axis xy

figure
imagesc(T_coeff, F_coeff, Y)
title('Spectrogram STFT - Scaled - Time, Frequency indexed')
xlabel('Time in s')
ylabel('Frequency in Hz')
colorbar
axis xy

figure
imagesc(T_coeff, F_coeff, Y_decibel)
title('Spectrogram STFT - Decibel Scaled - Time, Frequency indexed')
xlabel('Time in s')
ylabel('Frequency in Hz')
colorbar
axis xy