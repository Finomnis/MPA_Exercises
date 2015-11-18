clear;
close all;

[x, Fs] = audioread('Scale_Chromatic_Piano.wav');
[samples, channels] = size(x);
if(channels > 1)
    x = (x(:,1)+x(:,2))/2;
end
N = 1024;
H = N/2;
w = hann(N);
gamma = 10;

chi = spectrogram(x, w, N-H);
Y = abs(chi).^2;
[k, m] = size(chi);
T_coeff = (0:m).*(H/Fs)+(H/Fs);
F_coeff = (0:k).*(Fs/N);
Y_lf = zeros(127, m);
for p=0:127
    for k_lf = find(2^((p-0.5-69)/12)*440 <= F_coeff & 2^((p+0.5-69)/12)*440 > F_coeff)
        Y_lf(p,:) = Y_lf(p,:) + Y(k_lf,:);
    end
end

C = zeros(11, m);
for c=1:12
    for k_c = find(mod(1:127, 12)==c)
        C(c,:) = C(c,:) + Y_lf(k_c,:);
    end
end

figure
imagesc(T_coeff, 0:11, C)
title('Spectrogram STFT - Compressed')
xlabel('Time in s')
ylabel('Chroma key')
colorbar
axis xy